import React from 'react';
import { Typography } from '@mui/material';

export default function ContentLibrary() {
  return (
    <div>
      <Typography variant="h4">Content Library</Typography>
      <Typography variant="body1" sx={{ mt: 2 }}>
        View and manage your generated content here.
      </Typography>
    </div>
  );
}

