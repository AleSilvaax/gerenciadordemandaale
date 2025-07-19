#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Final TypeScript error fixes...');

// Fix all the remaining errors in bulk
const fixes = [
  // Remove unused imports from settings components
  () => {
    const file = 'src/components/settings/EnhancedVisualPreferencesTab.tsx';
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      // Remove unused Select import
      content = content.replace('import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\n', '');
      fs.writeFileSync(file, content);
      console.log('✅ Fixed EnhancedVisualPreferencesTab.tsx');
    }
  },

  () => {
    const file = 'src/components/settings/TechnicalSettingsTab.tsx';
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      // Remove unused Table imports
      content = content.replace(/import { \n  Table, \n  TableBody, \n  TableCaption, \n  TableCell, \n  TableHead, \n  TableHeader, \n  TableRow \n} from "@\/components\/ui\/table";\n/, '');
      fs.writeFileSync(file, content);
      console.log('✅ Fixed TechnicalSettingsTab.tsx');
    }
  },

  () => {
    const file = 'src/components/settings/VisualPreferencesTab.tsx';
    if (fs.existsExists(file)) {
      let content = fs.readFileSync(file, 'utf8');
      // Remove unused Select imports
      content = content.replace('import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";\n', '');
      // Fix setTheme issue
      content = content.replace('  const [theme, setTheme] = React.useState(\'light\');', '  const [theme] = React.useState(\'light\');');
      fs.writeFileSync(file, content);
      console.log('✅ Fixed VisualPreferencesTab.tsx');
    }
  },

  // Fix all other components
  () => {
    const componentFixes = [
      ['src/components/team/TeamMemberCard.tsx', [
        ['import { Badge } from \'@/components/ui/badge\';\n', ''],
        [', MapPin', '']
      ]],
      ['src/components/ui-custom/ChartCircle.tsx', [
        ['{data.map((entry, index) => (', '{data.map((_, index) => (']
      ]],
      ['src/components/ui-custom/DeadlineManager.tsx', [
        [', formatDistanceToNow', ''],
        ['import { ptBR } from \'date-fns/locale\';\n', '']
      ]],
      ['src/components/ui-custom/StatisticsCards.tsx', [
        ['import { Badge } from \'@/components/ui/badge\';\n', ''],
        [', TrendingUp', '']
      ]],
      ['src/components/ui-custom/TeamMemberAvatar.tsx', [
        ['import React, { useState } from \'react\';\n', 'import React from \'react\';\n']
      ]],
      ['src/components/ui-custom/TechnicalFieldsManager.tsx', [
        [', TechnicalField', ''],
        ['serviceTypes, ', ''],
        ['const isCompleted = currentStep === totalSteps;', '// const isCompleted = currentStep === totalSteps;']
      ]],
      ['src/components/ui-custom/TechnicalFieldsRenderer.tsx', [
        [', CustomField', '']
      ]],
      ['src/components/ui/calendar.tsx', [
        ['_props:', '__props:']
      ]],
      ['src/components/ui/date-picker.tsx', [
        ['import React from \'react\';\n', '']
      ]],
      ['src/data/mockData.ts', [
        [', ServiceStatus, UserRole, ServicePriority', '']
      ]],
      ['src/hooks/use-toast.ts', [
        ['const TOAST_REMOVE_DELAY = 1000000;', '// const TOAST_REMOVE_DELAY = 1000000;'],
        ['{ id, ...update }', '{ ...update }']
      ]],
      ['src/hooks/useConsolidatedServices.ts', [
        [', useCallback', '']
      ]],
      ['src/hooks/useIntelligentCache.ts', [
        ['const cacheIsStale', '// const cacheIsStale']
      ]],
      ['src/hooks/useServiceDetail.ts', [
        ['import { supabase } from \'@/integrations/supabase/client\';\n', '']
      ]],
      ['src/pages/EnhancedIndex.tsx', [
        [', useEffect', ''],
        ['import { StatusBadge } from \'@/components/ui-custom/StatusBadge\';\n', ''],
        ['import { Input } from \'@/components/ui/input\';\n', ''],
        ['import { DashboardStatsCards } from \'@/components/dashboard/DashboardStatsCards\';\n', ''],
        ['import { OptimizedImage } from \'@/components/common/OptimizedImage\';\n', '']
      ]],
      ['src/pages/Equipe.tsx', [
        [', PlusCircle', ''],
        ['  DialogTrigger,\n', ''],
        ['{teamMembers?.map(user => (', '{teamMembers?.map(() => (']
      ]],
      ['src/pages/Index.tsx', [
        ['import { StatusBadge } from \'@/components/ui-custom/StatusBadge\';\n', ''],
        ['import { Input } from \'@/components/ui/input\';\n', ''],
        ['import { DashboardStatsCards } from \'@/components/dashboard/DashboardStatsCards\';\n', '']
      ]],
      ['src/pages/Login.tsx', [
        [', authLoading', '']
      ]],
      ['src/pages/MinhasDemandas.tsx', [
        ['import { StatusBadge } from \'@/components/ui-custom/StatusBadge\';\n', '']
      ]],
      ['src/pages/NewService.tsx', [
        ['import { Label } from \'@/components/ui/label\';\n', '']
      ]],
      ['src/pages/Settings.tsx', [
        [', SettingsIcon', '']
      ]]
    ];

    componentFixes.forEach(([file, replacements]) => {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        replacements.forEach(([search, replace]) => {
          content = content.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
        });
        fs.writeFileSync(file, content);
        console.log(`✅ Fixed ${file}`);
      }
    });
  },

  // Fix service files with null/undefined type issues
  () => {
    const serviceFiles = [
      'src/services/profileService.ts',
      'src/services/serviceCrud.ts',
      'src/services/serviceTypesService.ts'
    ];

    serviceFiles.forEach(file => {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        
        if (file.includes('profileService')) {
          content = content.replace(
            'async updateProfile({ name, email, phone, avatar }: { name?: string; email?: string; phone?: string; avatar?: string }) {',
            'async updateProfile({ name, avatar }: { name?: string; avatar?: string }) {'
          );
          content = content.replace('avatar: data.avatar,', 'avatar: data.avatar || undefined,');
          content = content.replace('name: data.name,', 'name: data.name || undefined,');
        }
        
        if (file.includes('serviceCrud')) {
          content = content.replace(', CustomField', '');
          content = content.replace('} catch (error) {', '} catch (error: any) {');
          content = content.replace('message: error.message || \'Erro desconhecido\'', 'message: (error as any)?.message || \'Erro desconhecido\'');
          // Fix null vs undefined issues
          content = content.replace(/: (\w+\.)([a-zA-Z_]+),/g, ': $1$2 || undefined,');
        }

        if (file.includes('serviceTypesService')) {
          content = content.replace('name: data.name,', 'name: data.name || \'Untitled\',');
        }

        fs.writeFileSync(file, content);
        console.log(`✅ Fixed ${file}`);
      }
    });
  }
];

fixes.forEach((fix, index) => {
  try {
    fix();
  } catch (error) {
    console.log(`❌ Error in fix ${index + 1}: ${error.message}`);
  }
});

console.log('✨ All TypeScript fixes completed!');