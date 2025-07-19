#!/usr/bin/env node

const fs = require('fs');

console.log('🔧 Running ultimate TypeScript error fixes...');

// Apply all fixes in sequence
const allFixes = [
  // Simple search/AdvancedSearch fix
  () => {
    const file = 'src/components/search/AdvancedSearch.tsx';
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      content = content.replace('CardDescription, ', '');
      fs.writeFileSync(file, content);
      console.log('✅ Fixed AdvancedSearch.tsx');
    }
  },
  
  // Settings components - remove all unused imports
  () => {
    const files = [
      'src/components/settings/EnhancedVisualPreferencesTab.tsx',
      'src/components/settings/TechnicalSettingsTab.tsx',
      'src/components/settings/VisualPreferencesTab.tsx'
    ];
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        // Replace problematic imports
        content = content.replace(/import React from 'react';\n?/g, '');
        content = content.replace(/, CardDescription/g, '');
        content = content.replace(/import.*Button.*from.*;\n?/g, '');
        content = content.replace(/import.*Input.*from.*;\n?/g, '');
        content = content.replace(/import.*Label.*from.*;\n?/g, '');
        content = content.replace(/import.*Textarea.*from.*;\n?/g, '');
        content = content.replace(/import.*Separator.*from.*;\n?/g, '');
        content = content.replace(/import.*Switch.*from.*;\n?/g, '');
        content = content.replace(/import.*ScrollArea.*from.*;\n?/g, '');
        content = content.replace(/import.*Select.*from.*;\n?/g, '');
        content = content.replace(/, Monitor/g, '');
        content = content.replace(/, Zap/g, '');
        content = content.replace(/, Palette/g, '');
        content = content.replace(/, Layers/g, '');
        content = content.replace(/, Gauge/g, '');
        content = content.replace(/, Trash2/g, '');
        content = content.replace(/, Save/g, '');
        content = content.replace(/, Pencil/g, '');
        content = content.replace(/import.*ServiceTypeForm.*;\n?/g, '');
        content = content.replace(/import.*ServiceTypeList.*;\n?/g, '');
        content = content.replace(/import.*TechnicalFieldForm.*;\n?/g, '');
        content = content.replace(/import.*TechnicalFieldList.*;\n?/g, '');
        content = content.replace(/import.*useTheme.*;\n?/g, '');
        content = content.replace(/, isDarkMode/g, '');
        content = content.replace(/, toggleTheme/g, '');
        content = content.replace(/, setTheme/g, '');
        fs.writeFileSync(file, content);
        console.log(`✅ Fixed ${file}`);
      }
    });
  },
  
  // Team components
  () => {
    const file = 'src/components/team/TeamMemberCard.tsx';
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      content = content.replace('Badge, ', '');
      content = content.replace('MapPin, ', '');
      fs.writeFileSync(file, content);
      console.log('✅ Fixed TeamMemberCard.tsx');
    }
  },
  
  // UI Custom components
  () => {
    const files = [
      'src/components/ui-custom/ChartCircle.tsx',
      'src/components/ui-custom/DeadlineManager.tsx',
      'src/components/ui-custom/StatisticsCards.tsx',
      'src/components/ui-custom/TeamMemberAvatar.tsx',
      'src/components/ui-custom/TechnicalFieldsManager.tsx',
      'src/components/ui-custom/TechnicalFieldsRenderer.tsx'
    ];
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace('(entry, index)', '(_, index)');
        content = content.replace('formatDistanceToNow, ', '');
        content = content.replace(/import { ptBR }.*;\n?/g, '');
        content = content.replace('Badge, ', '');
        content = content.replace('TrendingUp, ', '');
        content = content.replace(', useState', '');
        content = content.replace('TechnicalField, ', '');
        content = content.replace('CustomField, ', '');
        content = content.replace('serviceTypes, ', '');
        content = content.replace('const isCompleted', '// const isCompleted');
        fs.writeFileSync(file, content);
        console.log(`✅ Fixed ${file}`);
      }
    });
  },
  
  // UI components
  () => {
    const files = [
      'src/components/ui/calendar.tsx',
      'src/components/ui/date-picker.tsx'
    ];
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace('_props:', '__props:');
        content = content.replace(/import React from 'react';\n?/g, '');
        fs.writeFileSync(file, content);
        console.log(`✅ Fixed ${file}`);
      }
    });
  },
  
  // Data and hooks
  () => {
    const files = [
      'src/data/mockData.ts',
      'src/hooks/use-toast.ts',
      'src/hooks/useConsolidatedServices.ts',
      'src/hooks/useIntelligentCache.ts',
      'src/hooks/useServiceDetail.ts'
    ];
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace('ServiceStatus, ', '');
        content = content.replace('UserRole, ', '');
        content = content.replace('ServicePriority, ', '');
        content = content.replace('const TOAST_REMOVE_DELAY', '// const TOAST_REMOVE_DELAY');
        content = content.replace('{ id, ...update }', '{ ...update }');
        content = content.replace('useCallback, ', '');
        content = content.replace('const cacheIsStale', '// const cacheIsStale');
        content = content.replace(/import.*supabase.*;\n?/g, '');
        fs.writeFileSync(file, content);
        console.log(`✅ Fixed ${file}`);
      }
    });
  },
  
  // Pages
  () => {
    const files = [
      'src/pages/EnhancedIndex.tsx',
      'src/pages/Equipe.tsx',
      'src/pages/Index.tsx',
      'src/pages/Login.tsx',
      'src/pages/MinhasDemandas.tsx',
      'src/pages/NewService.tsx',
      'src/pages/Settings.tsx'
    ];
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        let content = fs.readFileSync(file, 'utf8');
        content = content.replace('useEffect, ', '');
        content = content.replace('StatusBadge, ', '');
        content = content.replace('Input, ', '');
        content = content.replace('DashboardStatsCards, ', '');
        content = content.replace('OptimizedImage, ', '');
        content = content.replace('PlusCircle, ', '');
        content = content.replace('  DialogTrigger,', '');
        content = content.replace('user =>', '_ =>');
        content = content.replace('authLoading, ', '');
        content = content.replace('Label, ', '');
        content = content.replace('SettingsIcon, ', '');
        fs.writeFileSync(file, content);
        console.log(`✅ Fixed ${file}`);
      }
    });
  }
];

// Run all fixes
allFixes.forEach((fix, index) => {
  try {
    fix();
  } catch (error) {
    console.log(`❌ Error in fix ${index + 1}: ${error.message}`);
  }
});

console.log('✨ Ultimate fix completed!');