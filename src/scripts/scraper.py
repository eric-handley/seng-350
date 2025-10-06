#!/usr/bin/env python3
"""
UVic Room Data Scraper
Extracts room information from UVic's room search website and saves to JSON.
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
from urllib.parse import urljoin
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

BASE_URL = "https://www.uvic.ca/search/rooms/"
OUTPUT_FILE = "../server/data/uvic_rooms.json"

class UVicRoomScraper:
    def __init__(self, max_workers=10):
        self.max_workers = max_workers
        self.rooms_data = []
        self.lock = threading.Lock()
        
    def create_session(self):
        """Create a new session for thread-safe requests"""
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        return session
        
    def get_room_links(self):
        """Extract all room page links from the main rooms page"""
        print("Fetching room links...")
        session = self.create_session()
        response = session.get(BASE_URL)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Find all links to room pages
        room_links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            if 'pages/' in href and href.endswith('.php'):
                full_url = urljoin(BASE_URL, href)
                room_links.append(full_url)
        
        print(f"Found {len(room_links)} room links")
        return room_links
    
    def extract_room_data(self, room_url):
        """Extract detailed data from a single room page"""
        try:
            session = self.create_session()
            response = session.get(room_url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            room_data = {
                "room_number": "",
                "building": {"name": "", "short_name": ""},
                "capacity": 0,
                "room_type": "",
                "room_equipment": [],
                "url": room_url
            }
            
            # Extract room info from URL
            # URL format: https://www.uvic.ca/search/rooms/pages/cle-a224-classroom.php
            url_parts = room_url.split('/')[-1].replace('.php', '').split('-')
            if len(url_parts) >= 3:
                building_code = url_parts[0].upper()
                room_number = url_parts[1].upper()
                room_type = ' '.join(url_parts[2:]).replace('-', ' ').title()
                
                room_data["building"]["short_name"] = building_code
                room_data["room_number"] = room_number
                room_data["room_type"] = room_type
            
            # Extract building full name from map section
            map_match = re.search(r'general location of the <a[^>]*>([^<]+)</a>', str(soup), re.IGNORECASE)
            if map_match:
                building_name = map_match.group(1).strip()
                # Remove trailing period if present
                building_name = re.sub(r'\.$', '', building_name)
                room_data["building"]["name"] = building_name
            else:
                print(f"BUILDING EXTRACTION FAILED for {room_url}")
            
            # Find main content and extract from lists
            main_content = soup.find('main')
            if main_content:
                lists = main_content.find_all('ul')
                
                # List 1: Room details (capacity, seating)
                if len(lists) > 0:
                    room_details = [li.get_text().strip() for li in lists[0].find_all('li')]
                    for detail in room_details:
                        if 'capacity' in detail.lower():
                            capacity_match = re.search(r'(\d+)', detail)
                            if capacity_match:
                                room_data["capacity"] = int(capacity_match.group(1))
                
                # List 4 & 5: Equipment (presenting equipment and digital equipment)
                equipment_items = []
                for list_idx in [3, 4]:  # 0-indexed, so lists 4 and 5
                    if len(lists) > list_idx:
                        equipment_list = [li.get_text().strip() for li in lists[list_idx].find_all('li')]
                        for item in equipment_list:
                            parsed_equipment = self.parse_equipment(item)
                            if parsed_equipment:
                                equipment_items.extend(parsed_equipment)
                
                room_data["room_equipment"] = self.clean_equipment_list(equipment_items)
            
            return room_data
            
        except Exception as e:
            print(f"Error scraping {room_url}: {e}")
            return None
    
    def parse_equipment(self, text):
        """Parse equipment text to extract name and quantity"""
        equipment_list = []
        
        # First extract quantities from the beginning of the text
        quantity_match = re.match(r'^(\d+)\s+(.*)', text.strip())
        if quantity_match:
            quantity = int(quantity_match.group(1))
            equipment_text = quantity_match.group(2)
        else:
            quantity = 1
            equipment_text = text.strip()
        
        # Normalize the equipment name
        clean_name = self.normalize_equipment_name(equipment_text)
        if clean_name:
            equipment_list.append({"name": clean_name, "quantity": quantity})
        
        return equipment_list
    
    def normalize_equipment_name(self, name):
        """Normalize equipment names while preserving important distinctions"""
        original_name = name.strip()
        name = name.lower().strip()
        
        # Remove common prefixes
        name = re.sub(r'^(a\s+|an\s+|the\s+)', '', name)
        
        # Equipment normalization mapping: (pattern, replacement)
        equipment_patterns = [
            # Specific patterns first (most specific to least specific)
            (r'enhanced lecture capture.*blackboard recording', 'Enhanced lecture capture capability, which includes blackboard recording'),
            (r'video conferencing and lecture capture', 'Video conferencing and lecture capture capabilities'),
            (r'video\s+and\s+audio\s+laptop\s+connector.*hdmi x 2, vga, 3\.5mm audio', 'Video and audio laptop connectors (HDMI x 2, VGA, 3.5mm audio)'),
            (r'video\s+and\s+audio\s+laptop\s+connector.*hdmi, vga, 3\.5mm audio', 'Video and audio laptop connectors (HDMI, VGA, 3.5mm audio)'),
            (r'video\s+and\s+audio\s+laptop\s+connector.*hdmi, vga, audio aux', 'Video and audio laptop connectors (HDMI, VGA, audio aux)'),
            (r'video\s+and\s+audio\s+laptop\s+connector.*hdmi and usb', 'Video and audio laptop connectors (HDMI and USB)'),
            (r'video\s+and\s+audio\s+laptop\s+connector', 'Video and audio laptop connectors'),
            (r'document\s+camera.*electric height-adjustable desks', 'Document camera on electric height-adjustable desk'),
            (r'built-in\s+classroom\s+computer.*webcam', 'Built-in classroom computer with webcam'),
            (r'tv\s+display.*learning pod', 'TV displays at each learning pod'),
            (r'tv\s+display.*front row', 'TV displays for people sitting in the front row'),
            (r'wheeled\s+table.*chair', 'Wheeled table with chair'),
            (r'table.*chairs', 'Table with chairs'),
            (r'table.*chair', 'Table with chair'),
            (r'projector.*present.*against.*wall', 'Projector present against wall'),
            (r'motorized.*presentation\s+screen', 'Motorized presentation screen'),
            (r'presentation\s+screen', 'Pull-down presentation screen'),
            (r'touch\s+panel\s+controls.*av', 'Touch panel controls for AV system'),
            (r'button\s+controls.*av', 'Button controls for AV system'),
            (r'ceiling-\s+and\s+wall-mounted\s+cameras', 'Ceiling and wall-mounted cameras'),
            (r'monitors\s+on\s+arms', 'Monitors on arms'),
            (r'ceiling\s+mic\s+array', 'Ceiling mic array'),
            (r'whiteboard.*walls', 'Whiteboard walls'),
            (r'green.*(?:chalkboard|blackboard)', 'Green chalkboard'),
            (r'black.*(?:chalkboard|blackboard)', 'Black chalkboard'),
            (r'(?:chalkboard|blackboard)', 'Chalkboard'),
            (r'whiteboard', 'Whiteboard'),
            (r'digital\s+video\s+projector', 'Digital video projector'),
            (r'document\s+camera', 'Document camera'),
            (r'built-in\s+classroom\s+computer', 'Built-in classroom computer'),
            (r'lecture\s+capture\s+capability', 'Lecture capture capability'),
            (r'tv\s+display', 'TV display'),
            (r'sink.*water.*gas', 'Sink with water and gas taps'),
            (r'room\s+speakers', 'Room speakers'),
            (r'wireless\s+mic', 'Wireless mic'),
            (r'dvd\s+player', 'DVD player'),
            (r'podium', 'Podium'),
            (r'piano', 'Piano'),
        ]
        
        # Try each pattern
        for pattern, replacement in equipment_patterns:
            if re.search(pattern, name):
                return replacement
        
        # If no specific match but looks like equipment, return original
        equipment_keywords = ['board', 'camera', 'computer', 'projector', 'screen', 'mic', 'audio', 
                             'table', 'chair', 'podium', 'speaker', 'display', 'desk']
        if any(keyword in name for keyword in equipment_keywords):
            return original_name
        
        return None
    
    def clean_equipment_list(self, equipment_list):
        """Clean and consolidate equipment list"""
        equipment_map = {}
        
        for item in equipment_list:
            name = item["name"]
            quantity = item["quantity"]
            
            if name in equipment_map:
                equipment_map[name] += quantity
            else:
                equipment_map[name] = quantity
        
        return [{"name": name, "quantity": qty} for name, qty in equipment_map.items()]
    
    def scrape_single_room(self, room_url):
        """Scrape a single room and return the data"""
        room_data = self.extract_room_data(room_url)
        if room_data:
            with self.lock:
                self.rooms_data.append(room_data)
        return room_data is not None

    def scrape_all_rooms(self):
        """Main method to scrape all room data using parallel processing"""
        room_links = self.get_room_links()
        
        print(f"Scraping {len(room_links)} rooms using {self.max_workers} workers...")
        
        completed = 0
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all tasks
            future_to_url = {executor.submit(self.scrape_single_room, url): url for url in room_links}
            
            # Process completed tasks
            for future in as_completed(future_to_url):
                url = future_to_url[future]
                completed += 1
                
                try:
                    success = future.result()
                    status = "✓" if success else "✗"
                    print(f"[{completed}/{len(room_links)}] {status} {url.split('/')[-1]}")
                except Exception as e:
                    print(f"[{completed}/{len(room_links)}] ✗ {url.split('/')[-1]} - Error: {e}")
        
        print(f"Successfully scraped {len(self.rooms_data)} rooms")
    
    def save_to_json(self):
        """Save scraped data to JSON file"""
        # Ensure output directory exists
        output_path = os.path.join(os.path.dirname(__file__), OUTPUT_FILE)
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.rooms_data, f, indent=2, ensure_ascii=False)
        
        print(f"Saved {len(self.rooms_data)} rooms to {output_path}")

def main():
    scraper = UVicRoomScraper()
    scraper.scrape_all_rooms()
    scraper.save_to_json()
    
    print("Scraping completed!")

if __name__ == "__main__":
    main()