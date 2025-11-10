import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { format, addDays } from 'date-fns'
import { FilterPanel, FilterPanelProps } from '../../src/components/FilterPanel'

const buildProps = (overrides: Partial<FilterPanelProps> = {}): FilterPanelProps => {
  const defaults: FilterPanelProps = {
    building: '',
    setBuilding: jest.fn(),
    roomQuery: '',
    setRoomQuery: jest.fn(),
    date: format(addDays(new Date(), 5), 'yyyy-MM-dd'),
    setDate: jest.fn(),
    start: '07:00',
    setStart: jest.fn(),
    end: '08:00',
    setEnd: jest.fn(),
    showTimeFilters: true,
    showRoomFilter: true,
    showReserved: true,
    setShowReserved: jest.fn(),
    showReservedFilter: false,
  }

  return { ...defaults, ...overrides }
}

describe('<FilterPanel />', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('forwards building and room filter changes', () => {
    const props = buildProps()
    render(<FilterPanel {...props} />)

    const buildingInput = screen.getByPlaceholderText(/e\.g\., CLE, Engineering, Clearihue/i) as HTMLInputElement
    fireEvent.change(buildingInput, { target: { value: 'CLE' } })
    expect(props.setBuilding).toHaveBeenCalledWith('CLE')

    const roomInput = screen.getByPlaceholderText(/e\.g\., CLE-A308, 130/i) as HTMLInputElement
    fireEvent.change(roomInput, { target: { value: 'A308' } })
    expect(props.setRoomQuery).toHaveBeenCalledWith('A308')
  })

  it('commits normalized times on blur', () => {
    const setStart = jest.fn()
    const props = buildProps({ setStart })
    render(<FilterPanel {...props} />)

    const startInput = screen.getByPlaceholderText(/e\.g\., 7:30 AM/i) as HTMLInputElement
    fireEvent.change(startInput, { target: { value: '8:15 pm' } })
    fireEvent.blur(startInput)
    expect(setStart).toHaveBeenCalledWith('20:15')
    expect(startInput.value).toBe('8:15 PM')
  })

  it('reverts to fallback display when time parse fails', () => {
    const setStart = jest.fn()
    const props = buildProps({ setStart })
    render(<FilterPanel {...props} />)

    const startInput = screen.getByPlaceholderText(/e\.g\., 7:30 AM/i) as HTMLInputElement
    fireEvent.change(startInput, { target: { value: '25:00' } })
    fireEvent.blur(startInput)
    expect(setStart).not.toHaveBeenCalled()
    expect(startInput.value).toBe('7:00 AM')
  })

  it('renders show-reserved toggle when requested', () => {
    const setShowReserved = jest.fn()
    const props = buildProps({ showReservedFilter: true, setShowReserved, showReserved: false })
    render(<FilterPanel {...props} />)

    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    expect(setShowReserved).toHaveBeenCalledWith(true)
  })

  it('hides time inputs when showTimeFilters is false', () => {
    const props = buildProps({ showTimeFilters: false })
    render(<FilterPanel {...props} />)

    expect(screen.queryByPlaceholderText(/e\.g\., 7:30 AM/i)).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText(/e\.g\., 9:45 AM/i)).not.toBeInTheDocument()
  })
})
