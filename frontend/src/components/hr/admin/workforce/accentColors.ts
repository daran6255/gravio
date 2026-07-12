import type { Theme } from '@mui/material';

export const ACCENTS = ['primary', 'info', 'success', 'warning', 'error'] as const;

export const getAccent = (theme: Theme, idx: number) => theme.palette[ACCENTS[idx % ACCENTS.length]].main;
