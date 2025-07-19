#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to clean up with specific patterns
const cleanupMap = {
  // Dashboard components
  'src/components/dashboard/AdvancedDashboard.tsx': {
    removeImports: ['LineChart', 'Line', 'Users', 'Calendar', 'Filter'],
    removeVariables: ['user']
  },
  'src/components/dashboard/DashboardStatsCards.tsx': {
    removeImports: ['Users']
  },
  'src/components/dashboard/MotionContainer.tsx': {
    removeImports: ['AnimatePresence']
  },
  'src/components/dashboard/RealtimeMetrics.tsx': {
    removeImports: ['CardDescription', 'Badge']
  },
  
  // Layout components
  'src/components/layout/UserProfileMenu.tsx': {
    removeImports: ['React']
  },
  
  // Notifications
  'src/components/notifications/RealtimeNotifications.tsx': {
    removeImports: ['Bell'],
    removeTypes: ['NotificationData']
  },
  
  // Settings
  'src/components/settings/EnhancedVisualPreferencesTab.tsx': {
    removeImports: ['CardContent', 'Monitor', 'Zap'],
    removeVariables: ['isDarkMode', 'toggleTheme']
  },
  'src/components/settings/TechnicalSettingsTab.tsx': {
    removeImports: ['Input', 'Label', 'Textarea', 'Separator', 'Switch', 'ScrollArea', 'Trash2', 'Save', 'Pencil', 'TechnicalFieldForm', 'TechnicalFieldList']
  },
  'src/components/settings/VisualPreferencesTab.tsx': {
    removeImports: ['CardContent', 'Monitor', 'Palette', 'Layers', 'Gauge'],
    removeVariables: ['setTheme']
  },
  
  // UI Custom
  'src/components/ui-custom/ChartCircle.tsx': {
    removeVariables: ['entry']
  },
  'src/components/ui-custom/DeadlineManager.tsx': {
    removeImports: ['formatDistanceToNow', 'ptBR']
  },
  'src/components/ui-custom/StatisticsCards.tsx': {
    removeImports: ['Badge', 'TrendingUp']
  },
  'src/components/ui-custom/TeamMemberAvatar.tsx': {
    removeImports: ['useState']
  },
  'src/components/ui-custom/TechnicalFieldsManager.tsx': {
    removeImports: ['TechnicalField'],
    removeVariables: ['serviceTypes', 'isCompleted']
  },
  'src/components/ui-custom/TechnicalFieldsRenderer.tsx': {
    removeImports: ['CustomField']
  },
  
  // UI
  'src/components/ui/calendar.tsx': {
    removeVariables: ['_props']
  },
  'src/components/ui/date-picker.tsx': {
    removeImports: ['React']
  },
  
  // Data
  'src/data/mockData.ts': {
    removeImports: ['ServiceStatus', 'UserRole', 'ServicePriority']
  },
  
  // Hooks
  'src/hooks/use-toast.ts': {
    removeVariables: ['TOAST_REMOVE_DELAY', 'id']
  },
  'src/hooks/useConsolidatedServices.ts': {
    removeImports: ['useCallback']
  },
  'src/hooks/useIntelligentCache.ts': {
    removeVariables: ['cacheIsStale']
  },
  'src/hooks/useServiceDetail.ts': {
    removeImports: ['supabase']
  },
  
  // Pages
  'src/pages/EnhancedIndex.tsx': {
    removeImports: ['useEffect', 'StatusBadge', 'Input', 'DashboardStatsCards', 'OptimizedImage']
  },
  'src/pages/Equipe.tsx': {
    removeImports: ['PlusCircle', 'DialogTrigger'],
    removeVariables: ['user']
  },
  'src/pages/Index.tsx': {
    removeImports: ['StatusBadge', 'Input', 'DashboardStatsCards']
  },
  'src/pages/Login.tsx': {
    removeVariables: ['authLoading']
  },
  'src/pages/MinhasDemandas.tsx': {
    removeImports: ['StatusBadge']
  },
  'src/pages/NewService.tsx': {
    removeImports: ['Label']
  },
  'src/pages/Search.tsx': {
    removeImports: ['MapPin', 'Calendar', 'formatDate']
  },
  'src/pages/Settings.tsx': {
    removeImports: ['SettingsIcon']
  },
  'src/pages/Statistics.tsx': {
    removeImports: ['React', 'useEffect', 'Badge', 'LineChart', 'Line', 'AlertTriangle', 'Users', 'Calendar', 'FileText', 'Service']
  }
};

function removeFromImport(content, itemToRemove) {
  // Remove from named imports
  const namedImportRegex = new RegExp(`(\\{[^}]*),\\s*${itemToRemove}\\s*(,)?([^}]*\\})`, 'g');
  content = content.replace(namedImportRegex, (match, before, comma, after) => {
    if (before.trim() === '{' && after.trim() === '}') {
      return '';
    }
    return before + (after.startsWith(',') ? '' : '') + after;
  });
  
  // Remove standalone imports
  const standaloneImportRegex = new RegExp(`import\\s+${itemToRemove}\\s+from\\s+[^;]+;\\s*\n?`, 'g');
  content = content.replace(standaloneImportRegex, '');
  
  return content;
}

function removeVariable(content, varName) {
  // Remove variable declarations
  const varRegex = new RegExp(`\\s*const\\s+${varName}[^;]*;\\s*\n?`, 'g');
  content = content.replace(varRegex, '');
  
  // Remove from destructuring
  const destructureRegex = new RegExp(`(\\{[^}]*),\\s*${varName}\\s*(,)?([^}]*\\})`, 'g');
  content = content.replace(destructureRegex, (match, before, comma, after) => {
    return before + (after.startsWith(',') ? '' : '') + after;
  });
  
  return content;
}

function cleanFile(filePath, config) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  if (config.removeImports) {
    config.removeImports.forEach(importName => {
      const originalContent = content;
      content = removeFromImport(content, importName);
      if (content !== originalContent) modified = true;
    });
  }
  
  if (config.removeVariables) {
    config.removeVariables.forEach(varName => {
      const originalContent = content;
      content = removeVariable(content, varName);
      if (content !== originalContent) modified = true;
    });
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Cleaned: ${filePath}`);
  } else {
    console.log(`⚠️  No changes needed: ${filePath}`);
  }
}

// Execute cleanup
console.log('🧹 Starting comprehensive cleanup...\n');

Object.entries(cleanupMap).forEach(([filePath, config]) => {
  cleanFile(filePath, config);
});

console.log('\n✨ Cleanup completed!');