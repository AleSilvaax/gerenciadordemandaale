
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Detalhes da Demanda</h1>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExportReport('excel')}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleExportReport('pdf')}
          >
            <FilePenLine className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
