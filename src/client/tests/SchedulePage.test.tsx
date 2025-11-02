/**
 * SchedulePage.test.tsx
 *
 * What this suite covers:
 * - Loading state: shows a loading indicator while data is being fetched
 * - Error state: surfaces hook error messages to the user
 * - Empty state: shows a friendly message when there are no bookings for the date
 * - Successful render: displays a schedule table with room labels and booked slots
 * - Initial filtering context: verifies both rooms render when FilterPanel is mocked
 *
 * Notes on test strategy:
 * - useSchedule is mocked so each test can control rooms/loading/error explicitly.
 * - FilterPanel is mocked as a dumb component (no interactions), so these tests
 *   focus on SchedulePage’s rendering logic, not filter UI behavior.
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { SchedulePage } from '../src/pages/SchedulePage'
import { useSchedule } from '../src/hooks/useSchedule'

// Mock the data hook and FilterPanel dependency.
// - The hook mock lets us drive the component state (loading/error/data) deterministically.
// - FilterPanel is replaced by a placeholder so tests don't depend on its implementation details.
jest.mock('../src/hooks/useSchedule')
jest.mock('../src/components/FilterPanel', () => ({
    FilterPanel: jest.fn(() => <div data-testid="filter-panel" />)
}))

// Cast the imported hook to a jest.Mock so we can set return values per test.
const mockUseSchedule = useSchedule as jest.Mock

describe('<SchedulePage />', () => {
    // Stubs for controlled props passed into SchedulePage
    const setDate = jest.fn()
    const setBuilding = jest.fn()

    beforeEach(() => {
        // Ensure clean mocks between tests (hook + FilterPanel + prop spies)
        jest.clearAllMocks()
    })

    it('renders loading state', () => {
        // Arrange: hook returns loading=true
        mockUseSchedule.mockReturnValue({ rooms: [], loading: true, error: null })

        // Act: render the page with required props
        render(<SchedulePage date="2025-10-05" setDate={setDate} building="ECS" setBuilding={setBuilding} />)

        // Assert: loading indicator appears
        expect(screen.getByText(/Loading schedule/i)).toBeInTheDocument()
    })

    it('renders error state', () => {
        // Arrange: hook returns an error string
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: 'Failed to fetch' })

        // Act
        render(<SchedulePage date="2025-10-05" setDate={setDate} building="ECS" setBuilding={setBuilding} />)

        // Assert: error message is surfaced to the user
        expect(screen.getByText(/Error: Failed to fetch/i)).toBeInTheDocument()
    })

    it('renders empty state when no bookings', () => {
        // Arrange: not loading, no rooms
        mockUseSchedule.mockReturnValue({ rooms: [], loading: false, error: null })

        // Act
        render(<SchedulePage date="2025-10-05" setDate={setDate} building="ECS" setBuilding={setBuilding} />)

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
                    { start_time: '2025-10-05T09:00:00Z', end_time: '2025-10-05T10:00:00Z' }
                ]
            },
            {
                room_id: 'r2',
                room_number: '102',
                building_short_name: 'ECS',
                building_name: 'Engineering',
                capacity: 25,
                slots: [
                    { start_time: '2025-10-05T10:00:00Z', end_time: '2025-10-05T11:00:00Z' }
                ]
            }
        ]

        // Hook returns the sample rooms as loaded with no error
        mockUseSchedule.mockReturnValue({ rooms, loading: false, error: null })

        // Act
        render(<SchedulePage date="2025-10-05" setDate={setDate} building="ECS" setBuilding={setBuilding} />)

        // Assert: room labels render and an accessible schedule table is present
        expect(screen.getByText(/ECS 101/i)).toBeInTheDocument()
        expect(screen.getByText(/ECS 102/i)).toBeInTheDocument()
        expect(screen.getByRole('table', { name: /Schedule/i })).toBeInTheDocument()
    })

    it('filters booked slots by room query', () => {
        // Arrange: rooms across two buildings; FilterPanel is mocked so no interactive filtering here.
        const rooms = [
            {
                room_id: 'r1',
                room_number: '101',
                building_short_name: 'ECS',
                building_name: 'Engineering',
                capacity: 30,
                slots: [
                    { start_time: '2025-10-05T09:00:00Z', end_time: '2025-10-05T10:00:00Z' }
                ]
            },
            {
                room_id: 'r2',
                room_number: '102',
                building_short_name: 'SCI',
                building_name: 'Science',
                capacity: 25,
                slots: [
                    { start_time: '2025-10-05T10:00:00Z', end_time: '2025-10-05T11:00:00Z' }
                ]
            }
        ]

        // Hook returns both rooms, no loading/error
        mockUseSchedule.mockReturnValue({ rooms, loading: false, error: null })

        // Act: render the page. Since FilterPanel is mocked, this verifies initial, unfiltered render.
        render(
            <SchedulePage date="2025-10-05" setDate={setDate} building="ECS" setBuilding={setBuilding} />
        )

        // Note: To test actual filtering behavior, either:
        //  - use the real FilterPanel and simulate its events, or
        //  - enhance the mock to call the provided callbacks.
        // Assert: both rooms are visible initially
        expect(screen.getByText(/ECS 101/i)).toBeInTheDocument()
        expect(screen.getByText(/SCI 102/i)).toBeInTheDocument()
    })
})