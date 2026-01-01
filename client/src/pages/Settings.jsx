import React from 'react';
import { Typography } from '@mui/material';

export default function Settings() {
  return (
    <div>
      <Typography variant="h4">Settings</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Configure your preferences and account settings here.
      </Typography>
    </div>
  );
}

