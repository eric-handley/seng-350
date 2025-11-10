/**
 * SchedulePage.test.tsx
 *
 * What this suite covers:
 * - Loading state: shows a loading indicator while data is being fetched
 * - Error state: surfaces hook error messages to the user
 * - Empty state: shows a friendly message when there are no bookings for the date
 * - Successful render: displays a schedule table with room labels and booked slots
 * - Room query filtering: verifies client-side filtering by room number and building
 *
 * Notes on test strategy:
 * - useSchedule is mocked so each test can control rooms/loading/error explicitly.
 * - FilterPanel is NOT mocked, allowing us to test actual filtering interactions.
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SchedulePage } from '../src/pages/SchedulePage'
import { useSchedule } from '../src/hooks/useSchedule'
import { format, addDays } from 'date-fns'

// Mock the data hook only; FilterPanel remains unmocked so we can test filtering
jest.mock('../src/hooks/useSchedule')

// Cast the imported hook to a jest.Mock so we can set return values per test.
const mockUseSchedule = useSchedule as jest.Mock

describe('<SchedulePage />', () => {
    // Stubs for controlled props passed into SchedulePage
    const setDate = jest.fn()
    const setBuilding = jest.fn()
    const testDate = format(addDays(new Date(), 5), 'yyyy-MM-dd')

    beforeEach(() => {
        // Ensure clean mocks between tests (hook + FilterPanel + prop spies)
        jest.clearAllMocks()
    })

    it('renders loading state', () => {
        // Arrange: hook returns loading=true
        mockUseSchedule.mockReturnValue({ rooms: [], loading: true, error: null })

        // Act: render the page with required props
        render(<SchedulePage date={testDate} setDate={setDate} building="ECS" setBuilding={setBuilding} />)

        // Assert: loading indicator appears
        expect(screen.getByText(/Loading schedule/i)).toBeInTheDocument()
    })

    it('renders error state', () => {
        // Arrange: hook returns an error string
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: 'Failed to fetch' })

        // Act
        render(<SchedulePage date={testDate} setDate={setDate} building="ECS" setBuilding={setBuilding} />)

        // Assert: error message is surfaced to the user
        expect(screen.getByText(/Error: Failed to fetch/i)).toBeInTheDocument()
    })

    it('renders empty state when no bookings', () => {
        // Arrange: not loading, no rooms
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null })

        // Act
        render(<SchedulePage date={testDate} setDate={setDate} building="ECS" setBuilding={setBuilding} />)

        // Assert: empty-state copy is shown
        expect(screen.getByText(/No bookings for this date/i)).toBeInTheDocument()
    })

    it('renders table with booked slots', () => {
        // Arrange: sample data with two rooms and one slot each
        const rooms = [
            {
                room_id: 'r1',
                room_number: '101',
                building_short_name: 'ECS',
                building_name: 'Engineering',
                capacity: 30,
                slots: [
                    { start_time: `${testDate}T09:00:00Z`, end_time: `${testDate}T10:00:00Z` }
                ]
            },
            {
                room_id: 'r2',
                room_number: '102',
                building_short_name: 'ECS',
                building_name: 'Engineering',
                capacity: 25,
                slots: [
                    { start_time: `${testDate}T10:00:00Z`, end_time: `${testDate}T11:00:00Z` }
                ]
            }
        ]

        // Hook returns the sample rooms as loaded with no error
        mockUseSchedule.mockReturnValue({ rooms, loading: false, error: null })

        // Act
        render(<SchedulePage date={testDate} setDate={setDate} building="ECS" setBuilding={setBuilding} />)

        // Assert: room labels render and an accessible schedule table is present
        expect(screen.getByText(/ECS 101/i)).toBeInTheDocument()
        expect(screen.getByText(/ECS 102/i)).toBeInTheDocument()
        expect(screen.getByRole('table', { name: /Schedule/i })).toBeInTheDocument()
    })

    it('filters booked slots by room number query', () => {
        // Arrange: rooms across two buildings with different room numbers
        const rooms = [
            {
                room_id: 'r1',
                room_number: '101',
                building_short_name: 'ECS',
                building_name: 'Engineering',
                capacity: 30,
                slots: [
                    { start_time: `${testDate}T09:00:00Z`, end_time: `${testDate}T10:00:00Z` }
                ]
            },
            {
                room_id: 'r2',
                room_number: '102',
                building_short_name: 'SCI',
                building_name: 'Science',
                capacity: 25,
                slots: [
                    { start_time: `${testDate}T10:00:00Z`, end_time: `${testDate}T11:00:00Z` }
                ]
            }
        ]

        mockUseSchedule.mockReturnValue({ rooms, loading: false, error: null })

        // Act: render the page
        render(
            <SchedulePage date={testDate} setDate={setDate} building="" setBuilding={setBuilding} />
        )

        // Assert: both rooms visible initially
        expect(screen.getByText(/ECS 101/i)).toBeInTheDocument()
        expect(screen.getByText(/SCI 102/i)).toBeInTheDocument()

        // Act: filter by room number '101'
        const roomQueryInput = screen.getByPlaceholderText(/CLE-A308/i) as HTMLInputElement
        fireEvent.change(roomQueryInput, { target: { value: '101' } })

        // Assert: only ECS 101 is visible; SCI 102 is filtered out
        expect(screen.getByText(/ECS 101/i)).toBeInTheDocument()
        expect(screen.queryByText(/SCI 102/i)).not.toBeInTheDocument()
    })

    it('filters booked slots by building short name', () => {
        // Arrange: rooms across two buildings
        const rooms = [
            {
                room_id: 'r1',
                room_number: '101',
                building_short_name: 'ECS',
                building_name: 'Engineering',
                capacity: 30,
                slots: [
                    { start_time: `${testDate}T09:00:00Z`, end_time: `${testDate}T10:00:00Z` }
                ]
            },
            {
                room_id: 'r2',
                room_number: '102',
                building_short_name: 'SCI',
                building_name: 'Science',
                capacity: 25,
                slots: [
                    { start_time: `${testDate}T10:00:00Z`, end_time: `${testDate}T11:00:00Z` }
                ]
            }
        ]

        mockUseSchedule.mockReturnValue({ rooms, loading: false, error: null })

        // Act: render the page
        render(
            <SchedulePage date={testDate} setDate={setDate} building="" setBuilding={setBuilding} />
        )

        // Assert: both rooms visible initially
        expect(screen.getByText(/ECS 101/i)).toBeInTheDocument()
        expect(screen.getByText(/SCI 102/i)).toBeInTheDocument()

        // Act: filter by building 'ECS'
        const roomQueryInput = screen.getByPlaceholderText(/CLE-A308/i) as HTMLInputElement
        fireEvent.change(roomQueryInput, { target: { value: 'ECS' } })

        // Assert: only ECS 101 is visible; SCI 102 is filtered out
        expect(screen.getByText(/ECS 101/i)).toBeInTheDocument()
        expect(screen.queryByText(/SCI 102/i)).not.toBeInTheDocument()
    })

    it('filters by concatenated room identifier (e.g., "ECS101")', () => {
        // Arrange: rooms with different buildings and numbers
        const rooms = [
            {
                room_id: 'r1',
                room_number: '101',
                building_short_name: 'ECS',
                building_name: 'Engineering',
                capacity: 30,
                slots: [
                    { start_time: `${testDate}T09:00:00Z`, end_time: `${testDate}T10:00:00Z` }
                ]
            },
            {
                room_id: 'r2',
                room_number: '201',
                building_short_name: 'ECS',
                building_name: 'Engineering',
                capacity: 25,
                slots: [
                    { start_time: `${testDate}T10:00:00Z`, end_time: `${testDate}T11:00:00Z` }
                ]
            }
        ]

        mockUseSchedule.mockReturnValue({ rooms, loading: false, error: null })

        // Act: render the page
        render(
            <SchedulePage date={testDate} setDate={setDate} building="" setBuilding={setBuilding} />
        )

        // Act: filter by concatenated identifier 'ECS101'
        const roomQueryInput = screen.getByPlaceholderText(/CLE-A308/i) as HTMLInputElement
        fireEvent.change(roomQueryInput, { target: { value: 'ECS101' } })

        // Assert: only ECS 101 matches; ECS 201 is filtered out
        expect(screen.getByText(/ECS 101/i)).toBeInTheDocument()
        expect(screen.queryByText(/ECS 201/i)).not.toBeInTheDocument()
    })
})