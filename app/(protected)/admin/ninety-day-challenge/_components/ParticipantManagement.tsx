"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@nextui-org/button";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { Switch } from "@nextui-org/switch";
import { Chip } from "@nextui-org/chip";
import { Select, SelectItem } from "@nextui-org/select";
import { User } from "@nextui-org/user";
import { IconSearch, IconUserPlus, IconEye, IconTrash } from "@tabler/icons-react";

interface Participant {
  id: string;
  userId: string;
  isEnabled: boolean;
  joinedAt: string;
  completedDays: number;
  lastActiveDate: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    imageUrl: string;
  };
  challenge: {
    id: string;
    title: string;
  };
}

interface Challenge {
  id: string;
  title: string;
  isActive: boolean;
}

interface User {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  username: string;
}

export const ParticipantManagement = forwardRef<{ triggerAddParticipant: () => void }>((props, ref) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [userSearchTerm, setUserSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, [selectedChallenge]);

  useEffect(() => {
    if (userSearchTerm.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [userSearchTerm]);

  useImperativeHandle(ref, () => ({
    triggerAddParticipant: () => {
      setShowAddForm(true);
    }
  }));

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

  const fetchData = async () => {
    try {
      const [participantsRes, challengesRes, usersRes] = await Promise.all([
        fetch(`/api/admin/ninety-day-challenge/participants${selectedChallenge ? `?challengeId=${selectedChallenge}` : ''}`),
        fetch('/api/admin/ninety-day-challenge'),
        fetch('/api/admin/users')
      ]);

      if (participantsRes.ok) {
        const participantsData = await participantsRes.json();
        setParticipants(participantsData.participants);
      }

      if (challengesRes.ok) {
        const challengesData = await challengesRes.json();
        setChallenges(challengesData.challenges);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleParticipant = async (participantId: string, isEnabled: boolean) => {
    try {
      const response = await fetch(`/api/admin/ninety-day-challenge/participants/${participantId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isEnabled }),
      });

      if (response.ok) {
        setParticipants(participants.map(p =>
          p.id === participantId ? { ...p, isEnabled } : p
        ));
      }
    } catch (error) {
      console.error('Error updating participant:', error);
    }
  };

  const handleAddParticipant = async () => {
    if (!selectedUser || !selectedChallenge) return;

    try {
      const response = await fetch('/api/admin/ninety-day-challenge/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser,
          challengeId: selectedChallenge,
        }),
      });

      if (response.ok) {
        await fetchData();
        setSelectedUser("");
        setUserSearchTerm("");
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding participant:', error);
    }
  };


  const filteredParticipants = participants.filter(participant =>
    participant.user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    participant.user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    participant.user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-zinc-500">Loading participants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Search participants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={<IconSearch size={20} />}
            />

            <Select
              placeholder="Filter by challenge"
              aria-label="Filter participants by challenge"
              selectedKeys={selectedChallenge ? [selectedChallenge] : []}
              onSelectionChange={(keys) => {
                const selected = Array.from(keys)[0] as string;
                setSelectedChallenge(selected || "");
              }}
            >
              <SelectItem key="">All Challenges</SelectItem>
              {challenges.map((challenge) => (
                <SelectItem key={challenge.id} value={challenge.id}>
                  {challenge.title}
                </SelectItem>
              ))}
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Add Participant Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Add Participant</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                placeholder="Select Challenge"
                aria-label="Select challenge for participant"
                selectedKeys={selectedChallenge ? [selectedChallenge] : []}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setSelectedChallenge(selected || "");
                }}
                isRequired
              >
                {challenges.filter(c => c.isActive).map((challenge) => (
                  <SelectItem key={challenge.id} value={challenge.id}>
                    {challenge.title}
                  </SelectItem>
                ))}
              </Select>

              <div className="space-y-2">
                <Input
                  placeholder="Search for user by name or email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  startContent={<IconSearch size={20} />}
                  isRequired
                />

                {/* Search Results */}
                {userSearchTerm.length >= 2 && (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    {searching ? (
                      <div className="p-3 text-center text-gray-500">Searching...</div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <div
                          key={user.id}
                          className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                            selectedUser === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                          onClick={() => {
                            setSelectedUser(user.id);
                            setUserSearchTerm(`${user.firstName} ${user.lastName} (${user.email})`);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={user.imageUrl || '/default-avatar.png'}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">No users found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                color="primary"
                onPress={handleAddParticipant}
                isDisabled={!selectedUser || !selectedChallenge}
              >
                Add Participant
              </Button>
              <Button variant="flat" onPress={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>
      )}


      {/* Participants List */}
      <div className="space-y-3">
        {filteredParticipants.map((participant) => (
          <Card key={participant.id}>
            <CardBody>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <User
                    name={`${participant.user.firstName} ${participant.user.lastName}`}
                    description={participant.user.email}
                    avatarProps={{
                      src: participant.user.imageUrl,
                    }}
                    classNames={{ description: "text-zinc-500" }}
                  />

                  <div className="text-sm text-zinc-500 space-y-1">
                    <p><strong>Challenge:</strong> {participant.challenge.title}</p>
                    <p><strong>Days Completed:</strong> {participant.completedDays}</p>
                    <p><strong>Joined:</strong> {new Date(participant.joinedAt).toLocaleDateString()}</p>
                    {participant.lastActiveDate && (
                      <p><strong>Last Active:</strong> {new Date(participant.lastActiveDate).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Chip
                      color={participant.isEnabled ? "success" : "default"}
                      size="sm"
                    >
                      {participant.isEnabled ? "Enabled" : "Disabled"}
                    </Chip>
                    <Switch
                      size="sm"
                      isSelected={participant.isEnabled}
                      onValueChange={(value) => handleToggleParticipant(participant.id, value)}
                    />
                  </div>

                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<IconEye size={16} />}
                    as="a"
                    href={`/admin/ninety-day-challenge/participants/${participant.id}`}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}

        {filteredParticipants.length === 0 && (
          <Card>
            <CardBody className="text-center py-8">
              <p className="text-zinc-500">
                {searchQuery || selectedChallenge
                  ? "No participants found matching your criteria."
                  : "No participants added yet."}
              </p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
});

ParticipantManagement.displayName = 'ParticipantManagement';