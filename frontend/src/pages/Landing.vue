<script setup>
import NavBar from "../components/NavBar.vue";

defineOptions({
    name: 'Landing'
});

</script>

<template>
  <div>
    <NavBar />

    <!-- Hero Section -->
      <section
        class="relative overflow-hidden min-h-screen flex items-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-[80px]"
      >
      <!-- Background Pattern -->
      <div class="absolute inset-0 opacity-40">
        <div
          class="absolute inset-0"
          style="background-image: radial-gradient(circle at 1px 1px, #0761FE 1px, transparent 0); background-size: 20px 20px;"
        ></div>
      </div>
      
      <!-- Subtle Top Gradient -->
      <div class="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-[#0761FE]/8 to-transparent"></div>
      
      <!-- Subtle Bottom Gradient -->
      <div class="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#07CAFC]/6 to-transparent"></div>

      <div
        class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full"
      >
        <div
          class="flex flex-col lg:flex-row gap-12 items-center justify-center"
        >
          <!-- Left Content -->
          <div class="space-y-8 flex-1 max-w-2xl">
            <div class="space-y-6">
              <h1
                class="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight"
              >
                Split Bills
                <span
                  class="block text-[#0761FE] bg-gradient-to-r from-[#0761FE] to-[#07CAFC] bg-clip-text text-transparent"
                >
                  The Smart Way.
                </span>
              </h1>
              <p
                class="text-xl text-gray-700 leading-relaxed max-w-2xl font-medium"
              >
                Stop worrying about who owes what. SplitSmart makes bill
                splitting simple, transparent, and stress-free for groups of
                any size.
              </p>
            </div>

            <div class="flex flex-col sm:flex-row gap-4">
              <router-link to="/signup">
                <button
                  class="w-full sm:w-auto bg-gradient-to-r from-[#0761FE] to-[#013DC0] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-[#013DC0] hover:to-[#0761FE] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105"
                >
                  Get Started
                </button>
              </router-link>
            </div>
          </div>

          <!-- Right Side: Enhanced GIF Container -->
          <div class="flex justify-center items-center flex-1 max-w-2xl -mt-32">
            <div class="relative">
              <img src="/bg.gif" alt="Hero GIF" />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>

  <!-- Features Section -->
  <section class="min-h-[70vh] py-20 bg-white flex items-center">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div class="text-center mb-16">
        <h2 class="text-3xl sm:text-4xl font-bold text-[#013DC0] mb-4">
          Why Choose SplitSmart?
        </h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
          Powerful features designed to make bill splitting simple and fair for
          everyone
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <div
          class="text-center p-6 rounded-2xl hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-[#EDF5FB] to-white"
        >
          <div
            class="w-16 h-16 bg-[#0761FE] rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <img
              src="/Icons/white calculator.png"
              alt="Calculation Icon"
              class="w-8 h-8"
            />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-3">
            Smart Calculations
          </h3>
          <p class="text-gray-600">
            Automatically calculate who owes what with our advanced splitting
            system
          </p>
        </div>

        <!-- Feature 2 -->
        <div
          class="text-center p-6 rounded-2xl hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-[#EDF5FB] to-white"
        >
          <div
            class="w-16 h-16 bg-[#07CAFC] rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <img
              src="/Icons/white group.png"
              alt="Group Icon"
              class="w-7 h-7"
            />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-3">
            Group Management
          </h3>
          <p class="text-gray-600">
            Create and manage groups for different activities and shared
            expenses
          </p>
        </div>

        <!-- Feature 3 -->
        <div
          class="text-center p-6 rounded-2xl hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-[#EDF5FB] to-white"
        >
          <div
            class="w-16 h-16 bg-[#013DC0] rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <img
              src="/Icons/white report.png"
              alt="Report Icon"
              class="w-7 h-7"
            />
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-3">
            Detailed Reports
          </h3>
          <p class="text-gray-600">
            Track all expenses and get comprehensive reports on your spending
            patterns
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Infographic Steps Section -->
  <section class="min-h-[80vh] py-20 bg-gradient-to-br from-[#F5F9FF] via-[#EDF5FB] to-white flex items-center">
      <div class="max-w-6xl mx-auto px-2 sm:px-4 lg:px-6 w-full">
        <div class="text-center mb-12">
          <span class="text-xs font-medium text-[#0761FE] uppercase tracking-wider">Simple & Intuitive</span>
          <h2 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 mt-1">
            Split Bills in Three Easy Steps
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Settle group expenses effortlessly, — quick, clear, and stress free.
          </p>
        </div>

        <div class="relative max-w-4xl mx-auto">
            <div class="hidden lg:block absolute inset-y-0 left-1/2 w-1 bg-gradient-to-b from-[#0761FE] to-[#07CAFC] opacity-20 -ml-0.5"></div>

            <div class="space-y-10 lg:space-y-0">
                <div class="flex flex-col lg:flex-row items-center justify-between lg:odd:flex-row-reverse">
                    <div class="w-full lg:w-5/12 text-center lg:text-left space-y-2 p-4 rounded-xl shadow-lg bg-white border border-blue-100 transform hover:scale-[1.01] transition-transform duration-300">
                        <span class="text-3xl font-extrabold text-[#0761FE]">1</span>
                        <h3 class="text-xl font-semibold text-gray-900">Create a Group</h3>
                        <p class="text-base text-gray-600">
                            Start a new group for your trip, add your members, and keep all plans and updates in one place.
                        </p>
                    </div>
                    <div class="hidden lg:flex w-20 h-20 absolute left-1/2 transform -translate-x-1/2 items-center justify-center bg-white rounded-full shadow-xl border-4 border-[#0761FE]/20">
                        <img src="/Icons/white group.png" alt="Group Icon" class="w-7 h-7 filter grayscale" />
                    </div>
                    <div class="w-full lg:w-5/12"></div>
                </div>

                <div class="flex flex-col lg:flex-row items-center justify-between lg:odd:flex-row-reverse mt-10 lg:mt-0">
                    <div class="w-full lg:w-5/12 text-center lg:text-right space-y-2 p-4 rounded-xl shadow-lg bg-white border border-blue-100 transform hover:scale-[1.01] transition-transform duration-300">
                        <span class="text-3xl font-extrabold text-[#07CAFC]">2</span>
                        <h3 class="text-xl font-semibold text-gray-900">Add Expenses</h3>
                        <p class="text-base text-gray-600">
                            Simply log who paid, what they paid for, and the total amount. SplitSmart auto-calculates based on your split type.
                        </p>
                    </div>
                    <div class="hidden lg:flex w-20 h-20 absolute left-1/2 transform -translate-x-1/2 items-center justify-center bg-white rounded-full shadow-xl border-4 border-[#07CAFC]/20">
                        <img src="/Icons/white calculator.png" alt="Split Icon" class="w-7 h-7 filter grayscale" />
                    </div>
                    <div class="w-full lg:w-5/12"></div>
                </div>

                <div class="flex flex-col lg:flex-row items-center justify-between lg:odd:flex-row-reverse mt-10 lg:mt-0">
                    <div class="w-full lg:w-5/12 text-center lg:text-left space-y-2 p-4 rounded-xl shadow-lg bg-white border border-blue-100 transform hover:scale-[1.01] transition-transform duration-300">
                        <span class="text-3xl font-extrabold text-[#013DC0]">3</span>
                        <h3 class="text-xl font-semibold text-gray-900">Settle Up</h3>
                        <p class="text-base text-gray-600">
                            Our system simplifies debt settlement. Get clear payment instructions to mark them paid!
                        </p>
                    </div>
                    <div class="hidden lg:flex w-20 h-20 absolute left-1/2 transform -translate-x-1/2 items-center justify-center bg-white rounded-full shadow-xl border-4 border-[#013DC0]/20">
                        <img src="/Icons/white report.png" alt="Settle Icon" class="w-7 h-7 filter grayscale" />
                    </div>
                    <div class="w-full lg:w-5/12"></div>
                </div>
            </div>
        </div>
      </div>
    </section>

  <!-- Footer -->
  <footer class="relative overflow-hidden border-t border-transparent bg-white">
    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0761FE] via-[#07CAFC] to-[#013DC0] opacity-80"></div>
    <div class="pointer-events-none absolute inset-0 opacity-30">
      <div class="absolute inset-0" style="background-image: radial-gradient(circle at 1px 1px, #0761FE 1px, transparent 0); background-size: 22px 22px;"></div>
    </div>

    <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div class="flex flex-col items-center gap-3">
        <div class="flex items-center gap-3">
          <span class="text-lg font-semibold bg-gradient-to-r from-[#013DC0] via-[#0761FE] to-[#07CAFC] bg-clip-text text-transparent">SplitSmart</span>
        </div>
        <p class="text-center text-sm text-gray-600">
          Where group expenses become simple and effortless.
        </p>
        <div class="mt-2 text-[12px] text-gray-500">
          © 2025 SplitSmart. All Rights Reserved.
        </div>
      </div>
    </div>
  </footer>
</template>