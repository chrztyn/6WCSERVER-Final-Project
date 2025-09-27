<script>
import YouOweCard from '../components/reports/YouOweCard.vue';
import OwesYouCard from '../components/reports/OwesYouCard.vue';

export default {
  name: "Reports",
  components: {
    YouOweCard,
    OwesYouCard
  },
  data() {
    return {
      youOwe: [
        {
          id: 1,
          title: "Activity Name",
          name: "Firstname Lastname",
          amount: 0.00,
          status: "paid"
        },
        {
          id: 2,
          title: "Cinema",
          name: "Kyle Payawal",
          amount: 800.00,
          status: "to pay"
        }
      ],
      owesYou: [
        {
          id: 1,
          title: "Activity Name",
          name: "Firstname Lastname",
          amount: 0.00,
          status: "paid"
        },
        {
          id: 2,
          title: "Dinner",
          name: "Maxene Quiambao",
          amount: 1000.00,
          status: "pending"
        }
      ]
    };
  }
};
</script>

<template>
  <div class="reports-container">
    <div class="max-w-6xl mx-auto p-8">
      <!-- Header Section -->
      <div class="mb-8">
        <h1 style="font-size: 28px; font-weight: 700; color: #013DC0;">Report Details</h1>
      </div>
      <!-- Report Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <YouOweCard :items="youOwe" />
        <OwesYouCard :items="owesYou" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.reports-container {
  min-height: calc(100vh - 80px);
  background-color: #f8fafc;
}
</style>
