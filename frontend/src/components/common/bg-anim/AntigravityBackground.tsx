import React from 'react';
import { Box } from '@mui/material';
import { Canvas } from '@react-three/fiber';
import Particles from './medusa';

const AntigravityBackground: React.FC = () => {
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
      <Canvas
        camera={{ position: [0, 0, 5] }}
        // The canvas sits behind the page with pointer-events disabled so
        // clicks reach the real UI. Track the pointer on document.body
        // instead so the shader still receives live mouse coordinates.
        eventSource={document.body}
        eventPrefix="client"
      >
        <color attach="background" args={['#000000']} />
        <Particles />
      </Canvas>
    </Box>
  );
};

export default AntigravityBackground;
