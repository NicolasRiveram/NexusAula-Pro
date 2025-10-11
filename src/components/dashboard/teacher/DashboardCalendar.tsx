import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { es } from 'date-fns/locale';

interface DashboardCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date | undefined) => void;
  highlightedDays: Date[];
}

const DashboardCalendar: React.FC<DashboardCalendarProps> = ({ selectedDate, onDateSelect, highlightedDays }) => {
  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={onDateSelect}
      locale={es}
      className="p-0"
      modifiers={{ highlighted: highlightedDays }}
      modifiersStyles={{ highlighted: { fontWeight: 'bold', textDecoration: 'underline' } }}
    />
  );
};

export default DashboardCalendar;