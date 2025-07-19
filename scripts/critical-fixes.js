#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Quick fix for remaining critical errors
const fixes = [
  {
    file: 'src/components/search/AdvancedSearch.tsx',
    search: 'CardDescription',
    replace: ''
  },
  {
    file: 'src/components/team/TeamMemberCard.tsx',
    search: 'Badge, ',
    replace: ''
  },
  {
    file: 'src/components/team/TeamMemberCard.tsx',
    search: 'MapPin, ',
    replace: ''
  },
  {
    file: 'src/components/ui-custom/DeadlineManager.tsx',
    search: 'formatDistanceToNow, ',
    replace: ''
  },
  {
    file: 'src/components/ui-custom/DeadlineManager.tsx',
    search: 'import { ptBR } from "date-fns/locale";',
    replace: ''
  },
  {
    file: 'src/components/ui-custom/StatisticsCards.tsx',
    search: 'Badge, ',
    replace: ''
  },
  {
    file: 'src/components/ui-custom/StatisticsCards.tsx',
    search: 'TrendingUp, ',
    replace: ''
  },
  {
    file: 'src/components/ui-custom/TeamMemberAvatar.tsx',
    search: 'useState, ',
    replace: ''
  },
  {
    file: 'src/components/ui-custom/TechnicalFieldsManager.tsx',
    search: 'TechnicalField, ',
    replace: ''
  },
  {
    file: 'src/components/ui-custom/TechnicalFieldsRenderer.tsx',
    search: 'CustomField, ',
    replace: ''
  },
  {
    file: 'src/components/ui/date-picker.tsx',
    search: 'React, ',
    replace: ''
  },
  {
    file: 'src/data/mockData.ts',
    search: 'ServiceStatus, UserRole, ServicePriority, ',
    replace: ''
  },
  {
    file: 'src/hooks/useConsolidatedServices.ts',
    search: 'useCallback, ',
    replace: ''
  },
  {
    file: 'src/hooks/useServiceDetail.ts',
    search: 'import { supabase } from "@/integrations/supabase/client";',
    replace: ''
  },
  {
    file: 'src/pages/EnhancedIndex.tsx',
    search: 'useEffect, ',
    replace: ''
  },
  {
    file: 'src/pages/EnhancedIndex.tsx',
    search: 'StatusBadge, ',
    replace: ''
  },
  {
    file: 'src/pages/EnhancedIndex.tsx',
    search: 'Input, ',
    replace: ''
  },
  {
    file: 'src/pages/EnhancedIndex.tsx',
    search: 'DashboardStatsCards, ',
    replace: ''
  },
  {
    file: 'src/pages/EnhancedIndex.tsx',
    search: 'OptimizedImage, ',
    replace: ''
  },
  {
    file: 'src/pages/Equipe.tsx',
    search: 'PlusCircle, ',
    replace: ''
  },
  {
    file: 'src/pages/Index.tsx',
    search: 'StatusBadge, ',
    replace: ''
  },
  {
    file: 'src/pages/Index.tsx',
    search: 'Input, ',
    replace: ''
  },
  {
    file: 'src/pages/Index.tsx',
    search: 'DashboardStatsCards, ',
    replace: ''
  },
  {
    file: 'src/pages/MinhasDemandas.tsx',
    search: 'StatusBadge, ',
    replace: ''
  },
  {
    file: 'src/pages/NewService.tsx',
    search: 'Label, ',
    replace: ''
  },
  {
    file: 'src/pages/Settings.tsx',
    search: 'SettingsIcon, ',
    replace: ''
  },
  {
    file: 'src/pages/Statistics.tsx',
    search: 'React, ',
    replace: ''
  },
  {
    file: 'src/pages/Statistics.tsx',
    search: 'useEffect, ',
    replace: ''
  },
  {
    file: 'src/pages/Statistics.tsx',
    search: 'Badge, ',
    replace: ''
  },
  {
    file: 'src/pages/Statistics.tsx',
    search: 'LineChart, Line, ',
    replace: ''
  },
  {
    file: 'src/pages/Statistics.tsx',
    search: 'AlertTriangle, Users, Calendar, FileText, ',
    replace: ''
  },
  {
    file: 'src/pages/Statistics.tsx',
    search: 'import { Service } from "@/types/serviceTypes";',
    replace: ''
  }
];

function applyFix(fix) {
  const filePath = fix.file;
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      content = content.replace(fix.search, fix.replace);
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${filePath}`);
    } catch (error) {
      console.log(`❌ Error fixing ${filePath}: ${error.message}`);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
}

console.log('🚀 Starting critical fixes...');
fixes.forEach(applyFix);
console.log('✨ Critical fixes completed!');