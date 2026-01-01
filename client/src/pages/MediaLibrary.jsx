import React from 'react';
import { Typography } from '@mui/material';

export default function MediaLibrary() {
  return (
    <div>
      <Typography variant="h4">Media Library</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        Manage your generated images and media assets here.
      </Typography>
    </div>
  );
}

