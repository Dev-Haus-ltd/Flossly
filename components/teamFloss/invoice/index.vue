<template>
invoice
  </template>
  
  <script setup>

  </script>
  
  <style scoped>
  .invoice-page {
    margin-top: 40px;
    width: 100%;
    height: 88vh;
    background-size: contain;
    background-position: center;
    position: relative;
  }
  
  /* floating button container */
  .nav-buttons {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    gap: 8px;
  }
  
  /* button style */
  .nav-buttons button {
    background: rgba(0, 0, 0, 0.6);
    border: none;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 18px;
    transition: background 0.2s ease;
  }
  
  .nav-buttons button:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.8);
  }
  
  .nav-buttons button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  </style>
  