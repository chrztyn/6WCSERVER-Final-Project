<script>
export default {
  name: "GroupExpenseList",
  data() {
    return {
      group: null,
      expenses: []
    };
  },
  created() {
    this.loadGroupData();
  },
  watch: {
    '$route.params.id'() {
      this.loadGroupData();
    }
  },
  methods: {
    loadGroupData() {
      const groupId = this.$route.params.id;
      
      // placeholder data for different groups
      const groupsData = {
        1: {
          id: 1,
          name: "Group 1",
          activity: "Activity Name",
          expenses: [
            {
              id: 1,
              details: "Lunch",
              payor: "Micah Lapuz",
              amount: 100.00,
              date: "10-30-25",
              status: "all paid"
            },
            {
              id: 2,
              details: "Cinema",
              payor: "Kyle Payawal",
              amount: 800.00,
              date: "10-31-25",
              status: "pending"
            },
            {
              id: 3,
              details: "Dinner",
              payor: "Maxene Quiambao",
              amount: 1000.00,
              date: "10-31-25",
              status: "pending"
            }
          ]
        },
        2: {
          id: 2,
          name: "Group 2",
          activity: "Activity Name",
          expenses: [
            {
              id: 4,
              details: "placeholder",
              payor: "placeholder",
              amount: 0.00,
              date: "placeholder",
              status: "all paid"
            },
            {
              id: 5,
              details: "placeholder",
              payor: "placeholder",
              amount: 0.00,
              date: "placeholder",
              status: "pending"
            }
          ]
        },
        3: {
          id: 3,
          name: "Group 3",
          activity: "Activity Name",
          expenses: [
            {
              id: 6,
              details: "placeholder",
              payor: "placeholder",
              amount: 0.00,
              date: "placeholder",
              status: "all paid"
            },
            {
              id: 7,
              details: "placeholder",
              payor: "placeholder",
              amount: 0.00,
              date: "placeholder",
              status: "all paid"
            },
            {
              id: 8,
              details: "placeholder",
              payor: "placeholder",
              amount: 0.00,
              date: "placeholder",
              status: "pending"
            }
          ]
        },
        4: {
          id: 4,
          name: "Group 4",
          activity: "Activity Name",
          expenses: [
            {
              id: 9,
              details: "placeholder",
              payor: "placeholder",
              amount: 0.00,
              date: "placeholder",
              status: "pending"
            }
          ]
        }
      };

      // Load group data or use default
      const groupData = groupsData[groupId] || {
        id: groupId,
        name: `Group ${groupId}`,
        activity: "Activity Name",
        expenses: []
      };

      this.group = {
        id: groupData.id,
        name: groupData.name,
        activity: groupData.activity
      };
      this.expenses = groupData.expenses;
    },
    getStatusClass(status) {
      switch (status) {
        case 'all paid':
          return 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium';
        case 'pending':
          return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium';
        default:
          return 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium';
      }
    },
    formatAmount(amount) {
      return amount.toFixed(2);
    }
  }
};
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Group Header -->
    <div class="bg-white border-b border-gray-200 px-6 py-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-bold text-[#013DC0]">{{ group.name }}</h1>
          <p class="text-lg text-gray-600 mt-1">{{ group.activity }}</p>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex gap-3">
          <button class="bg-[#0761FE] hover:bg-[#013DC0] text-white rounded-lg p-3 font-medium transition-colors mb-4 flex items-center justify-center gap-2">
            +Add Member
          </button>
          <button class="bg-[#0761FE] hover:bg-[#013DC0] text-white rounded-lg p-3 font-medium transition-colors mb-4 flex items-center justify-center gap-2">
            +New Expense
          </button>
        </div>
      </div>
    </div>

    <!-- Expense Table -->
    <div class="px-6 py-6">
      <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">DETAILS</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">PAYOR</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">AMOUNT</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">DATE</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-gray-900">STATUS</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr 
              v-for="expense in expenses" 
              :key="expense.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                {{ expense.details }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ expense.payor }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 font-medium">
                {{ formatAmount(expense.amount) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {{ expense.date }}
              </td>
              <td class="px-6 py-4">
                <span :class="getStatusClass(expense.status)">
                  {{ expense.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
