<script setup>
import { defineOptions } from "vue"
import NavBar from "../components/NavBar.vue";

defineOptions({
    name: 'Landing'
});

</script>

<template>
  <NavBar/>
  <main class="w-full h-full">
    <div class="flex items-center justify-start p-30 landing-background absolute inset-0 w-screen h-screen">
      <div class="flex flex-col items-start z-10 max-w-4xl w-3/4 pr-8">
        <div>
          <h1 class="text-xl md:text-8xl sm:text-2xl leading-tight font-bold text-left text-[#474747] mb-8">Worry Less About the Bill, Enjoy More of the Moment</h1>
        </div>
        <div>
          <button class="px-30 py-4 bg-white text-gray-700 rounded-full shadow-md hover:shadow-lg transition-shadow text-2xl hover:bg-blue-500 hover:text-white">Get Started</button>
        </div>
      </div>
      <div class="absolute right-8 bottom-0 w-3/5 flex justify-end">
        <img src="/landing.png" alt="Coins and receipt" class="h-auto max-h-full object-contain"/>
      </div>
    </div>
  </main>
</template>