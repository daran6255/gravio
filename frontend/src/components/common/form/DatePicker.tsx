import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

interface DatePickerProps {
  label: string;
  value: string | null; // ISO Date String 'YYYY-MM-DD' or null
  onChange: (value: string) => void;
  format?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  textFieldProps?: any;
  minDate?: string; // ISO Date String 'YYYY-MM-DD'
  maxDate?: string; // ISO Date String 'YYYY-MM-DD'
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  format = 'DD/MMM/YYYY',
  size = 'small',
  fullWidth = true,
  textFieldProps,
  minDate,
  maxDate,
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <MuiDatePicker
        label={label}
        format={format}
        value={value ? dayjs(value) : null}
        onChange={(newValue) => onChange(newValue ? newValue.format('YYYY-MM-DD') : '')}
        minDate={minDate ? dayjs(minDate) : undefined}
        maxDate={maxDate ? dayjs(maxDate) : undefined}
        slotProps={{
          textField: {
            size,
            fullWidth,
            ...textFieldProps,
          }
        }}
      />
    </LocalizationProvider>
  );
};

export default DatePicker;
