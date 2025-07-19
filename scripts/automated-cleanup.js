#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Quick fix for the most critical errors
const criticalFixes = [
  // Remove unused imports from specific files
  {
    file: 'src/components/dashboard/DashboardStatsCards.tsx',
    remove: ['Users'],
    line: 4
  },
  {
    file: 'src/components/dashboard/MotionContainer.tsx', 
    remove: ['AnimatePresence'],
    line: 2
  },
  {
    file: 'src/components/dashboard/RealtimeMetrics.tsx',
    remove: ['CardDescription', 'Badge'],
    line: 4
  },
  {
    file: 'src/components/layout/UserProfileMenu.tsx',
    remove: ['React'],
    line: 2
  },
  {
    file: 'src/components/notifications/RealtimeNotifications.tsx',
    remove: ['Bell', 'NotificationData'],
    line: 6
  },
  {
    file: 'src/components/search/AdvancedSearch.tsx',
    remove: ['CardDescription'], 
    line: 7
  },
  {
    file: 'src/components/team/TeamMemberCard.tsx',
    remove: ['Badge', 'MapPin'],
    line: 5
  },
  {
    file: 'src/components/ui-custom/DeadlineManager.tsx',
    remove: ['formatDistanceToNow', 'ptBR'],
    line: 5
  },
  {
    file: 'src/components/ui-custom/StatisticsCards.tsx',
    remove: ['Badge', 'TrendingUp'],
    line: 4
  },
  {
    file: 'src/components/ui-custom/TeamMemberAvatar.tsx',
    remove: ['useState'],
    line: 2
  },
  {
    file: 'src/components/ui-custom/TechnicalFieldsManager.tsx',
    remove: ['TechnicalField'],
    line: 11
  },
  {
    file: 'src/components/ui-custom/TechnicalFieldsRenderer.tsx',
    remove: ['CustomField'],
    line: 8
  },
  {
    file: 'src/components/ui/date-picker.tsx',
    remove: ['React'],
    line: 2
  },
  {
    file: 'src/data/mockData.ts',
    remove: ['ServiceStatus', 'UserRole', 'ServicePriority'],
    line: 2
  },
  {
    file: 'src/hooks/useConsolidatedServices.ts',
    remove: ['useCallback'],
    line: 1
  },
  {
    file: 'src/hooks/useServiceDetail.ts',
    remove: ['supabase'],
    line: 12
  },
  {
    file: 'src/pages/EnhancedIndex.tsx',
    remove: ['useEffect', 'StatusBadge', 'Input', 'DashboardStatsCards', 'OptimizedImage'],
    line: 1
  },
  {
    file: 'src/pages/Equipe.tsx',
    remove: ['PlusCircle', 'DialogTrigger'],
    line: 2
  },
  {
    file: 'src/pages/Index.tsx',
    remove: ['StatusBadge', 'Input', 'DashboardStatsCards'],
    line: 5
  },
  {
    file: 'src/pages/MinhasDemandas.tsx',
    remove: ['StatusBadge'],
    line: 6
  },
  {
    file: 'src/pages/NewService.tsx',
    remove: ['Label'],
    line: 10
  },
  {
    file: 'src/pages/Settings.tsx',
    remove: ['SettingsIcon'],
    line: 2
  },
  {
    file: 'src/pages/Statistics.tsx',
    remove: ['React', 'useEffect', 'Badge', 'LineChart', 'Line', 'AlertTriangle', 'Users', 'Calendar', 'FileText', 'Service'],
    line: 2
  }
];

function removeImportsFromLine(content, itemsToRemove, lineNumber) {
  const lines = content.split('\n');
  if (lineNumber <= lines.length) {
    const line = lines[lineNumber - 1];
    let newLine = line;
    
    itemsToRemove.forEach(item => {
      // Remove from imports
      newLine = newLine.replace(new RegExp(`\\s*${item}\\s*,?`, 'g'), '');
      newLine = newLine.replace(new RegExp(`,\\s*${item}`, 'g'), '');
      newLine = newLine.replace(new RegExp(`${item}\\s*,\\s*`, 'g'), '');
      newLine = newLine.replace(new RegExp(`{\\s*,`, 'g'), '{');
      newLine = newLine.replace(new RegExp(`,\\s*}`, 'g'), '}');
      newLine = newLine.replace(new RegExp(`{\\s*}`, 'g'), '{}');
    });
    
    // If line becomes empty import, remove it
    if (newLine.match(/import\s*{\s*}\s*from/)) {
      newLine = '';
    }
    
    lines[lineNumber - 1] = newLine;
  }
  
  return lines.join('\n');
}

console.log('🚀 Starting automated cleanup...');

criticalFixes.forEach(fix => {
  const filePath = fix.file;
  if (fs.existsSync(filePath)) {
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      content = removeImportsFromLine(content, fix.remove, fix.line);
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${filePath}`);
    } catch (error) {
      console.log(`❌ Error fixing ${filePath}: ${error.message}`);
    }
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('✨ Automated cleanup completed!');