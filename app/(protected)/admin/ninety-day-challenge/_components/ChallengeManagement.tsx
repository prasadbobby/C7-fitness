"use client";

import { useState, useEffect } from "react";
import { Button } from "@nextui-org/button";
import { Card, CardBody, CardHeader } from "@nextui-org/card";
import { Input } from "@nextui-org/input";
import { Textarea } from "@nextui-org/input";
import { Switch } from "@nextui-org/switch";
import { Chip } from "@nextui-org/chip";
import { IconPlus, IconCalendarEvent, IconEdit, IconTrash } from "@tabler/icons-react";
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

export function ChallengeManagement() {
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
    return <div>Loading challenges...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">
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

      {/* Create Button */}
      {!showCreateForm && (
        <Button
          color="primary"
          startContent={<IconPlus size={20} />}
          onPress={() => setShowCreateForm(true)}
        >
          Create New Challenge
        </Button>
      )}

      {/* Challenges List */}
      <div className="space-y-3">
        {challenges.map((challenge) => (
          <Card key={challenge.id}>
            <CardBody>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <IconCalendarEvent size={20} className="text-primary" />
                    <h4 className="font-semibold text-lg">{challenge.title}</h4>
                    <Chip
                      color={challenge.isActive ? "success" : "default"}
                      size="sm"
                    >
                      {challenge.isActive ? "Active" : "Inactive"}
                    </Chip>
                  </div>

                  {challenge.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      {challenge.description}
                    </p>
                  )}

                  <div className="text-sm text-zinc-500 space-y-1">
                    <p>
                      <strong>Duration:</strong> {' '}
                      {new Date(challenge.startDate).toLocaleDateString()} - {' '}
                      {new Date(challenge.endDate).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Participants:</strong> {challenge.participantCount}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<IconEdit size={16} />}
                    onPress={() => startEdit(challenge)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    startContent={<IconTrash size={16} />}
                    onPress={() => handleDelete(challenge.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}

        {challenges.length === 0 && (
          <Card>
            <CardBody className="text-center py-8">
              <p className="text-zinc-500">No challenges created yet.</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}