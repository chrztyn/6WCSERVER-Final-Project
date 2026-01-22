// src/services/groupService.js
import api from './api';

class GroupService {
  // Get all groups the user is a member of
  async getMyGroups() {
    try {
      const response = await api.get('/groups/my');
      return response.data;
    } catch (error) {
      console.error('Error fetching user groups:', error);
      throw error;
    }
  }

  // Create a new group
  async createGroup(groupData) {
    try {
      const response = await api.post('/groups', groupData);
      return response.data;
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  // Leave a group
  async leaveGroup(groupId) {
    try {
      const response = await api.delete(`/groups/${groupId}/leave`);
      return response.data;
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  }

  // Add members to a group
  async addMembers(groupId, members) {
    try {
      const response = await api.post(`/groups/${groupId}/add-members`, { members });
      return response.data;
    } catch (error) {
      console.error('Error adding members:', error);
      throw error;
    }
  }

  // Get group details by ID
  async getGroupById(groupId) {
    try {
      const response = await api.get(`/groups/${groupId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching group details:', error);
      throw error;
    }
  }
}

export default new GroupService();