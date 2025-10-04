"use client";

import { useState, useEffect } from "react";
import { useDisclosure } from "@nextui-org/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@nextui-org/modal";
import { Button } from "@nextui-org/button";
import { Input } from "@nextui-org/input";
import BottomSheet from "@/components/UI/BottomSheet";
import { IconSearch, IconUserPlus } from "@tabler/icons-react";

interface User {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  username: string;
}

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  onParticipantAdded: () => void;
}

export function AddParticipantModal({
  isOpen,
  onClose,
  challengeId,
  onParticipantAdded,
}: AddParticipantModalProps) {
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [adding, setAdding] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (userSearchTerm.length >= 2 && !selectedUser) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [userSearchTerm, selectedUser]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const searchUsers = async () => {
    if (!userSearchTerm || userSearchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(userSearchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedUser || !challengeId) {
      console.error('Missing required data:', { selectedUser, challengeId });
      return;
    }

    console.log('Adding participant:', { selectedUser, challengeId });
    setAdding(true);
    try {
      const response = await fetch('/api/admin/ninety-day-challenge/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          challengeId: challengeId,
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('Participant added successfully');
        if (data.message) {
          alert(data.message); // Show success message if participant was enabled
        }
        onParticipantAdded();
        handleClose();
      } else {
        console.error('Failed to add participant:', data);
        alert(`Failed to add participant: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding participant:', error);
      alert(`Error adding participant: ${error.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setSelectedUser("");
    setUserSearchTerm("");
    setSearchResults([]);
    onClose();
  };

  const modalContent = (
    <div className="space-y-4">
      <Input
        placeholder="Search for user by name or email..."
        value={userSearchTerm}
        onChange={(e) => setUserSearchTerm(e.target.value)}
        startContent={<IconSearch size={20} />}
        isRequired
        classNames={{
          input: "text-foreground",
          label: "text-foreground",
        }}
      />

      {/* Search Results */}
      {userSearchTerm.length >= 2 && !selectedUser && (
        <div className="max-h-64 overflow-y-auto border border-divider rounded-lg">
          {searching ? (
            <div className="p-4 text-center text-foreground-500">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            searchResults.map((user) => (
              <div
                key={user.id}
                className={`p-4 hover:bg-content2 cursor-pointer border-b border-divider last:border-b-0 transition-colors ${
                  selectedUser === user.userId ? 'bg-primary/10 border-primary/20' : ''
                }`}
                onClick={() => {
                  console.log('Selecting user:', user);
                  setSelectedUser(user.userId); // Use userId instead of id for API consistency
                  setUserSearchTerm(`${user.firstName} ${user.lastName} (${user.email})`);
                  setSearchResults([]); // Clear search results immediately
                }}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.imageUrl || '/default-avatar.png'}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-foreground">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-foreground-500">
                      {user.email}
                    </div>
                    {user.username && (
                      <div className="text-xs text-foreground-400">
                        @{user.username}
                      </div>
                    )}
                  </div>
                  {selectedUser === user.userId && (
                    <div className="text-primary">
                      <IconUserPlus size={20} />
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-foreground-500">
              No users found matching "{userSearchTerm}"
            </div>
          )}
        </div>
      )}

      {selectedUser && (
        <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-sm text-success-600 dark:text-success-400">
              ✓ User selected and ready to be added to the challenge
            </p>
            <Button
              size="sm"
              variant="light"
              color="success"
              onPress={() => {
                setSelectedUser("");
                setUserSearchTerm("");
                setSearchResults([]);
              }}
            >
              Change User
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <BottomSheet
        isOpen={isOpen}
        onClose={handleClose}
        title="Add Participant to Challenge"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onPress={handleClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleAddParticipant}
              isDisabled={!selectedUser}
              isLoading={adding}
              startContent={!adding ? <IconUserPlus size={16} /> : null}
            >
              {adding ? "Adding..." : "Add Participant"}
            </Button>
          </>
        }
      >
        {modalContent}
      </BottomSheet>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h3 className="text-lg font-semibold">Add Participant to Challenge</h3>
          <p className="text-sm text-foreground-500">Search and select a user to add to this challenge</p>
        </ModalHeader>
        <ModalBody>
          {modalContent}
        </ModalBody>
        <ModalFooter>
          <Button variant="flat" onPress={handleClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleAddParticipant}
            isDisabled={!selectedUser}
            isLoading={adding}
            startContent={!adding ? <IconUserPlus size={16} /> : null}
          >
            {adding ? "Adding..." : "Add Participant"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}