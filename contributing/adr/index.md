---
title: Decision records
description: The architecture decision records of Newses, with their status.
---

<script setup>
import { data as adrs } from '../../.vitepress/adr.data.ts';
</script>

# Decision records

Each record states a decision, its context, and its consequences. A later record supersedes one that no longer holds.

<table>
  <thead>
    <tr><th>Record</th><th>Status</th></tr>
  </thead>
  <tbody>
    <tr v-for="adr in adrs" :key="adr.number">
      <td><a :href="adr.link">{{ adr.number }}. {{ adr.title }}</a></td>
      <td>{{ adr.status }}</td>
    </tr>
  </tbody>
</table>
