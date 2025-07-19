#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Targeted TypeScript fixes...');

// Direct fixes to resolve the most critical issues
const criticalFixes = [
  // Fix settings tabs completely
  {
    file: 'src/components/settings/EnhancedVisualPreferencesTab.tsx',
    operations: [
      { search: 'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\n', replace: '' }
    ]
  },
  {
    file: 'src/components/settings/TechnicalSettingsTab.tsx', 
    operations: [
      { search: /import { \n  Table, \n  TableBody, \n  TableCaption, \n  TableCell, \n  TableHead, \n  TableHeader, \n  TableRow \n} from "@\/components\/ui\/table";\n/, replace: '' }
    ]
  },
  {
    file: 'src/components/settings/VisualPreferencesTab.tsx',
    operations: [
      { search: 'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\n', replace: '' },
      { search: '  const [theme, setTheme] = React.useState(\'light\');', replace: '  const [theme] = React.useState(\'light\');' }
    ]
  },
  
  // Quick fixes for common issues
  {
    file: 'src/components/team/TeamMemberCard.tsx',
    operations: [
      { search: 'import { Badge } from \'@/components/ui/badge\';\n', replace: '' },
      { search: ', MapPin', replace: '' }
    ]
  },
  {
    file: 'src/components/ui-custom/ChartCircle.tsx',
    operations: [
      { search: '{data.map((entry, index) => (', replace: '{data.map((_, index) => (' }
    ]
  },
  {
    file: 'src/components/ui-custom/DeadlineManager.tsx',
    operations: [
      { search: ', formatDistanceToNow', replace: '' },
      { search: 'import { ptBR } from \'date-fns/locale\';\n', replace: '' }
    ]
  },
  {
    file: 'src/components/ui-custom/StatisticsCards.tsx',
    operations: [
      { search: 'import { Badge } from \'@/components/ui/badge\';\n', replace: '' },
      { search: ', TrendingUp', replace: '' }
    ]
  },
  {
    file: 'src/components/ui-custom/TeamMemberAvatar.tsx',
    operations: [
      { search: 'import React, { useState } from \'react\';\n', replace: 'import React from \'react\';\n' }
    ]
  },
  {
    file: 'src/components/ui-custom/TechnicalFieldsManager.tsx',
    operations: [
      { search: ', TechnicalField', replace: '' },
      { search: 'serviceTypes, ', replace: '' },
      { search: 'const isCompleted = currentStep === totalSteps;', replace: '// const isCompleted = currentStep === totalSteps;' }
    ]
  },
  {
    file: 'src/components/ui-custom/TechnicalFieldsRenderer.tsx',
    operations: [
      { search: ', CustomField', replace: '' }
    ]
  },
  {
    file: 'src/components/ui/calendar.tsx',
    operations: [
      { search: '_props:', replace: '__props:' }
    ]
  },
  {
    file: 'src/components/ui/date-picker.tsx',
    operations: [
      { search: 'import React from \'react\';\n', replace: '' }
    ]
  },
  {
    file: 'src/data/mockData.ts',
    operations: [
      { search: ', ServiceStatus, UserRole, ServicePriority', replace: '' }
    ]
  },
  {
    file: 'src/hooks/use-toast.ts',
    operations: [
      { search: 'const TOAST_REMOVE_DELAY = 1000000;', replace: '// const TOAST_REMOVE_DELAY = 1000000;' },
      { search: '{ id, ...update }', replace: '{ ...update }' }
    ]
  },
  {
    file: 'src/hooks/useConsolidatedServices.ts',
    operations: [
      { search: ', useCallback', replace: '' }
    ]
  },
  {
    file: 'src/hooks/useIntelligentCache.ts',
    operations: [
      { search: 'const cacheIsStale', replace: '// const cacheIsStale' }
    ]
  },
  {
    file: 'src/hooks/useServiceDetail.ts',
    operations: [
      { search: 'import { supabase } from \'@/integrations/supabase/client\';\n', replace: '' }
    ]
  },
  {
    file: 'src/pages/EnhancedIndex.tsx',
    operations: [
      { search: ', useEffect', replace: '' },
      { search: 'import { StatusBadge } from \'@/components/ui-custom/StatusBadge\';\n', replace: '' },
      { search: 'import { Input } from \'@/components/ui/input\';\n', replace: '' },
      { search: 'import { DashboardStatsCards } from \'@/components/dashboard/DashboardStatsCards\';\n', replace: '' },
      { search: 'import { OptimizedImage } from \'@/components/common/OptimizedImage\';\n', replace: '' }
    ]
  },
  {
    file: 'src/pages/Equipe.tsx',
    operations: [
      { search: ', PlusCircle', replace: '' },
      { search: '  DialogTrigger,\n', replace: '' },
      { search: '{teamMembers?.map(user => (', replace: '{teamMembers?.map(() => (' }
    ]
  },
  {
    file: 'src/pages/Index.tsx',
    operations: [
      { search: 'import { StatusBadge } from \'@/components/ui-custom/StatusBadge\';\n', replace: '' },
      { search: 'import { Input } from \'@/components/ui/input\';\n', replace: '' },
      { search: 'import { DashboardStatsCards } from \'@/components/dashboard/DashboardStatsCards\';\n', replace: '' }
    ]
  },
  {
    file: 'src/pages/Login.tsx',
    operations: [
      { search: ', authLoading', replace: '' }
    ]
  },
  {
    file: 'src/pages/MinhasDemandas.tsx',
    operations: [
      { search: 'import { StatusBadge } from \'@/components/ui-custom/StatusBadge\';\n', replace: '' }
    ]
  },
  {
    file: 'src/pages/NewService.tsx',
    operations: [
      { search: 'import { Label } from \'@/components/ui/label\';\n', replace: '' }
    ]
  },
  {
    file: 'src/pages/Settings.tsx',
    operations: [
      { search: ', SettingsIcon', replace: '' }
    ]
  },
  {
    file: 'src/services/profileService.ts',
    operations: [
      { search: 'async updateProfile({ name, email, phone, avatar }: { name?: string; email?: string; phone?: string; avatar?: string }) {', replace: 'async updateProfile({ name, avatar }: { name?: string; avatar?: string }) {' },
      { search: 'avatar: data.avatar,', replace: 'avatar: data.avatar || undefined,' },
      { search: 'name: data.name,', replace: 'name: data.name || undefined,' }
    ]
  },
  {
    file: 'src/services/serviceCrud.ts',
    operations: [
      { search: ', CustomField', replace: '' },
      { search: '} catch (error) {', replace: '} catch (error: any) {' },
      { search: 'message: error.message || \'Erro desconhecido\'', replace: 'message: (error as any)?.message || \'Erro desconhecido\'' }
    ]
  }
];

criticalFixes.forEach(fix => {
  const { file, operations } = fix;
  if (fs.existsSync(file)) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      operations.forEach(({ search, replace }) => {
        if (search instanceof RegExp) {
          content = content.replace(search, replace);
        } else {
          content = content.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
        }
      });
      fs.writeFileSync(file, content);
      console.log(`✅ Fixed ${file}`);
    } catch (error) {
      console.log(`❌ Error fixing ${file}: ${error.message}`);
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log('✨ Critical fixes completed!');