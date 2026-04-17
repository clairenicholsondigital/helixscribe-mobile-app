import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { AppButton } from '@/components/Button';
import { Screen } from '@/components/Screen';
import { SectionCard } from '@/components/SectionCard';
import { WorkflowForm } from '@/components/WorkflowForm';
import { createWorkflowV2 } from '@/api/workflowsV2';
import { createEmptyWorkflowDraft, draftToCreatePayload } from '@/lib/workflowDrafts';
import { formatError } from '@/lib/utils';

export default function NewWorkflowScreen() {
  const [draft, setDraft] = useState(createEmptyWorkflowDraft());
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    setSaving(true);
    try {
      const payload = draftToCreatePayload(draft);
      const result = await createWorkflowV2(payload);

      Alert.alert('Workflow created', `Created workflow ${result.workflow.title}.`);
      router.replace({
        pathname: '/workflows/[workflowId]',
        params: { workflowId: result.workflow.id }
      });
    } catch (error) {
      Alert.alert('Create failed', formatError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'New workflow' }} />
      <Screen
        title="New workflow"
        subtitle="Build the smallest workable V2 workflow on mobile, then refine it on the detail screen if needed.">
        <WorkflowForm draft={draft} onChange={setDraft} />

        <SectionCard title="Create">
          <AppButton
            disabled={saving}
            label={saving ? 'Creating…' : 'Create workflow'}
            onPress={handleCreate}
          />
        </SectionCard>
      </Screen>
    </>
  );
}
