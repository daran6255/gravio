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
  colorStart = '#7D8CF3', // Periwinkle blue
  colorEnd = '#537CDE',   // Deeper indigo blue
  count = 450,
  magnetRadius = 13,
  ringRadius = 9,
  particleSize = 0.8,
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
        background: '#000000',
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
        lerpSpeed={0.055}
        waveSpeed={0.4}
        waveAmplitude={1.4}
      />
    </Box>
  );
};

export default AntigravityBackground;
