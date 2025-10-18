<script>
  import { MessageSquare } from 'lucide-svelte';
</script>

<div class="card bg-base-100 shadow-lg border border-primary/30">
  <div class="card-body">
    <h2 class="text-xl font-bold text-primary mb-4">Have Feedback?</h2>
    <p class="text-primary/70 mb-4">
      Your feedback helps us make nomStack better for everyone. Please let us know what you think. We do read every email.
    </p>
    <a href="mailto:support@nomstack.com" class="btn btn-primary">
      <MessageSquare class="h-4 w-4" />
      Send Feedback (opens email)
    </a>
    <div class="flex justify-center">
        <small class="text-primary">Our email address: 
        <a href="mailto:support@nomstack.com">support@nomstack.com</a></small>
    </div>
    </div>
</div>
