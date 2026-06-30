import React from 'react';
import { Box } from '@mui/material';
import Antigravity from './Antigravity';

interface AntigravityBackgroundProps {
  colorStart?: string;
  colorEnd?: string;
  count?: number;
  magnetRadius?: number;
  ringRadius?: number;
  particleSize?: number;
  particleShape?: 'capsule' | 'sphere' | 'box' | 'tetrahedron';
}

const AntigravityBackground: React.FC<AntigravityBackgroundProps> = ({
  colorStart = '#8B7CF6', // Logo Purple
  colorEnd = '#4EA8FF',   // Logo Blue
  count = 350,
  magnetRadius = 12,
  ringRadius = 10,
  particleSize = 1.8,
  particleShape = 'capsule',
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(8, 9, 13, 0.25) 0%, rgba(8, 9, 13, 0.95) 90%)',
          pointerEvents: 'none',
        }
      }}
    >
      <Antigravity
        colorStart={colorStart}
        colorEnd={colorEnd}
        count={count}
        magnetRadius={magnetRadius}
        ringRadius={ringRadius}
        particleSize={particleSize}
        particleShape={particleShape}
        autoAnimate={true}
        lerpSpeed={0.08}
        waveSpeed={0.5}
        waveAmplitude={1.2}
      />
    </Box>
  );
};

export default AntigravityBackground;
