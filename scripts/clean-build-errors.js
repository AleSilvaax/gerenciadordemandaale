#!/usr/bin/env node

/**
 * Script para limpar automaticamente erros de build relacionados a importações não utilizadas
 */

const fs = require('fs');
const path = require('path');

// Mapeamento de arquivos e correções
const corrections = {
  'src/components/ui-custom/ServiceCard.tsx': {
    removeImports: ['memo'],
    removeVariables: ['variant']
  },
  'src/components/ui-custom/MobileServiceCard.tsx': {
    removeImports: ['Calendar', 'useNavigate']
  },
  'src/pages/Demandas.tsx': {
    removeImports: ['Search', 'Filter', 'Input', 'Badge', 'CardTitle'],
    removeVariables: ['serviceTypes', 'showAdvancedFilters', 'setShowAdvancedFilters', 'cancelled']
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
  'src/components/ui-custom/ChartCircle.tsx': {
    removeVariables: ['entry']
  },
  'src/pages/EnhancedIndex.tsx': {
    removeImports: ['useEffect', 'StatusBadge', 'Input', 'DashboardStatsCards', 'OptimizedImage']
  },
  'src/pages/Equipe.tsx': {
    removeImports: ['PlusCircle', 'DialogTrigger'],
    removeVariables: ['user']
  },
  'src/pages/Estatisticas.tsx': {
    removeImports: ['Button']
  },
  'src/components/team/TeamMemberCard.tsx': {
    removeImports: ['Badge', 'MapPin']
  },
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
  'src/components/layout/EnhancedNavbar.tsx': {
    removeImports: ['useAuth']
  },
  'src/components/notifications/RealtimeNotifications.tsx': {
    removeImports: ['Bell'],
    removeTypes: ['NotificationData']
  },
  'src/components/search/AdvancedSearch.tsx': {
    removeImports: ['CardDescription']
  },
  'src/components/common/OptimizedImage.tsx': {
    removeVariables: ['quality']
  },
  'src/components/admin/AuditLogViewer.tsx': {
    removeVariables: ['filterLogs', 'filters', 'log']
  },
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
  }
};

function cleanFile(filePath, config) {
  if (!fs.existsSync(filePath)) {
    console.log(`Arquivo não encontrado: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Remove importações não utilizadas
  if (config.removeImports) {
    config.removeImports.forEach(importName => {
      // Remove from named imports
      const namedImportRegex = new RegExp(`(\\{[^}]*),\\s*${importName}\\s*(,)?([^}]*\\})`, 'g');
      content = content.replace(namedImportRegex, (match, before, comma, after) => {
        modified = true;
        if (before.trim() === '{' && after.trim() === '}') {
          return ''; // Remove the entire import line if it becomes empty
        }
        return before + (after.startsWith(',') ? '' : ',') + after;
      });

      // Remove standalone imports
      const standaloneImportRegex = new RegExp(`import\\s+${importName}\\s+from\\s+[^;]+;\\s*\n?`, 'g');
      content = content.replace(standaloneImportRegex, () => {
        modified = true;
        return '';
      });
    });
  }

  // Remove tipos não utilizados
  if (config.removeTypes) {
    config.removeTypes.forEach(typeName => {
      const typeRegex = new RegExp(`\\s*${typeName}\\s*,?`, 'g');
      content = content.replace(typeRegex, () => {
        modified = true;
        return '';
      });
    });
  }

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Limpo: ${filePath}`);
  } else {
    console.log(`⚠️  Nenhuma modificação necessária: ${filePath}`);
  }
}

// Executar limpeza
console.log('🧹 Iniciando limpeza de erros de build...\n');

Object.entries(corrections).forEach(([filePath, config]) => {
  cleanFile(filePath, config);
});

console.log('\n✨ Limpeza concluída!');