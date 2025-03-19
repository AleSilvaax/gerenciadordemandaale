
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ServiceForm from './ServiceForm';
import ReportForm from './ReportForm';
import PhotosTab from './PhotosTab';
import BottomActionBar from './BottomActionBar';
import { useServiceDetail } from '../context/ServiceDetailContext';
import { useServiceFormSubmit } from '../hooks/useServiceFormSubmit';

const ServiceTabContainer: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    formState, 
    handleFormChange,
    isSubmitting,
    pdfGenerated
  } = useServiceDetail();

  const { 
    handleSubmit, 
    handleGeneratePDF, 
    handleDownloadPDF 
  } = useServiceFormSubmit();

  return (
    <Tabs defaultValue="general" className="w-full" onValueChange={setActiveTab} value={activeTab}>
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="general">Geral</TabsTrigger>
        <TabsTrigger value="report">Relatório</TabsTrigger>
        <TabsTrigger value="photos">Fotos</TabsTrigger>
      </TabsList>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TabsContent value="general" className="space-y-4">
          <ServiceForm />
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <ReportForm />
        </TabsContent>

        <TabsContent value="photos" className="space-y-4">
          <PhotosTab />
        </TabsContent>

        <BottomActionBar
          isSubmitting={isSubmitting}
          pdfGenerated={pdfGenerated}
          status={formState.status}
          onCancel={() => window.location.href = '/demandas'}
          onGeneratePDF={handleGeneratePDF}
          onDownloadPDF={handleDownloadPDF}
          onSave={handleSubmit}
        />
      </form>
    </Tabs>
  );
};

export default ServiceTabContainer;
