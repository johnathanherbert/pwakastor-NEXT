'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import AgingDashboard from '../../components/Aging';

export default function AgingPage() {
  return <AgingDashboard />;
}