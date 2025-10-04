"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@nextui-org/button";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { Textarea } from "@nextui-org/input";
import { Switch } from "@nextui-org/switch";
import { Chip } from "@nextui-org/chip";
import { IconPlus, IconCalendarEvent, IconEdit, IconTrash, IconEye } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import DatePicker from "@/components/UI/DatePicker";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  participantCount: number;
  createdAt: string;
}

export const ChallengeManagement = forwardRef<{ triggerCreateChallenge: () => void }>((props, ref) => {
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: new Date(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    isActive: true,
  });

  useEffect(() => {
    fetchChallenges();
  }, []);

  useImperativeHandle(ref, () => ({
    triggerCreateChallenge: () => {
      setShowCreateForm(true);
    }
  }));

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/admin/ninety-day-challenge');
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingChallenge
        ? `/api/admin/ninety-day-challenge/${editingChallenge.id}`
        : '/api/admin/ninety-day-challenge';

      const method = editingChallenge ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchChallenges();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving challenge:', error);
    }
  };

  const handleDelete = async (challengeId: string) => {
    if (!confirm('Are you sure you want to delete this challenge?')) return;

    try {
      const response = await fetch(`/api/admin/ninety-day-challenge/${challengeId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchChallenges();
      }
    } catch (error) {
      console.error('Error deleting challenge:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
    });
    setShowCreateForm(false);
    setEditingChallenge(null);
  };

  const startEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description || "",
      startDate: new Date(challenge.startDate),
      endDate: new Date(challenge.endDate),
      isActive: challenge.isActive,
    });
    setShowCreateForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-zinc-500">Loading challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card shadow="none" className="shadow-md border-none bg-gradient-to-br from-background to-default-50">
          <CardHeader className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <IconPlus className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}
            </h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Challenge Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                isRequired
              />

              <Textarea
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={(date) => date && setFormData({ ...formData, startDate: date })}
                />

                <DatePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={(date) => date && setFormData({ ...formData, endDate: date })}
                />
              </div>

              <Switch
                isSelected={formData.isActive}
                onValueChange={(value) => setFormData({ ...formData, isActive: value })}
              >
                Active Challenge
              </Switch>

              <div className="flex gap-2">
                <Button type="submit" color="primary">
                  {editingChallenge ? 'Update Challenge' : 'Create Challenge'}
                </Button>
                <Button variant="flat" onPress={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}


      {/* Challenges List */}
      <div className="space-y-3">
        {challenges.map((challenge) => (
          <Card key={challenge.id} shadow="none" className="shadow-md border-none hover:shadow-lg transition-shadow">
            <CardBody className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <IconCalendarEvent size={18} className="text-primary" />
                    </div>
                    <h4 className="font-bold text-xl text-foreground">{challenge.title}</h4>
                    <Chip
                      color={challenge.isActive ? "success" : "default"}
                      variant="flat"
                      size="sm"
                      className="font-medium"
                    >
                      {challenge.isActive ? "Active" : "Inactive"}
                    </Chip>
                  </div>

                  {challenge.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                      {challenge.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-secondary rounded-full"></div>
                        <span className="text-zinc-500">Duration</span>
                      </div>
                      <p className="font-medium text-foreground pl-4">
                        {new Date(challenge.startDate).toLocaleDateString()} - {' '}
                        {new Date(challenge.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-warning rounded-full"></div>
                        <span className="text-zinc-500">Participants</span>
                      </div>
                      <p className="font-medium text-foreground pl-4">
                        {challenge.participantCount} enrolled
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-6">
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    startContent={<IconEye size={16} />}
                    onPress={() => router.push(`/admin/ninety-day-challenge/challenges/${challenge.id}`)}
                    className="font-medium"
                  >
                    View Challenge
                  </Button>
                  <Button
                    size="sm"
                    color="secondary"
                    variant="flat"
                    startContent={<IconEdit size={16} />}
                    onPress={() => startEdit(challenge)}
                    className="font-medium"
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    startContent={<IconTrash size={16} />}
                    onPress={() => handleDelete(challenge.id)}
                    className="font-medium"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}

        {challenges.length === 0 && (
          <Card shadow="none" className="shadow-md border-none">
            <CardBody className="text-center py-12">
              <div className="space-y-4">
                <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <IconCalendarEvent className="w-8 h-8 text-zinc-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">No Challenges Yet</h3>
                  <p className="text-zinc-500 text-sm">
                    Create your first 90-day transformation challenge to get started.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
});

ChallengeManagement.displayName = 'ChallengeManagement';