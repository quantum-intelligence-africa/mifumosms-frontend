import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { ContactList } from "@/components/contacts/ContactList";
import { ContactAddDialog } from "@/components/contacts/ContactAddDialog";
import { useContacts } from "@/hooks/useContacts";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const Contacts = () => {
  const { 
    contacts, 
    totalCount, 
    isLoading, 
    currentPage,
    hasNextPage,
    hasPreviousPage,
    fetchContacts, 
    deleteContact, 
    createContact,
    goToNextPage,
    goToPreviousPage,
    goToPage
  } = useContacts();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleRefresh = () => {
    fetchContacts();
  };

  const handleDelete = async (contactId: string) => {
    try {
      await deleteContact(contactId);
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader 
          onMenuClick={() => setSidebarOpen(true)} 
          isMobile={isMobile}
        />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <ContactList
            contacts={contacts}
            totalCount={totalCount}
            isLoading={isLoading}
            currentPage={currentPage}
            hasNextPage={hasNextPage}
            hasPreviousPage={hasPreviousPage}
            onRefresh={handleRefresh}
            onDelete={handleDelete}
            onPageChange={goToPage}
            onNextPage={goToNextPage}
            onPreviousPage={goToPreviousPage}
          />
          
          {/* Floating Action Button for Mobile */}
          {isMobile && (
            <div className="fixed bottom-6 right-6 z-40">
              <ContactAddDialog onContactAdded={handleRefresh}>
                <Button
                  size="lg"
                  className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary-dark"
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </ContactAddDialog>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Contacts;