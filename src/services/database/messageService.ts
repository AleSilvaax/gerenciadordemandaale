
import { supabase, handleDatabaseError } from './baseService';

// Add a message to a service
export const addServiceMessageToDatabase = async (
  serviceId: string, 
  messageData: { text: string, type: string, author: string, author_name: string }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('service_messages')
      .insert({
        service_id: serviceId,
        message: messageData.text,
        sender_id: messageData.author,
        sender_name: messageData.author_name,
        sender_role: messageData.type
      });
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding message to service:', error);
    return false;
  }
};
