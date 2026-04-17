import { Picker } from '@react-native-picker/picker';
import { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { StepEditor } from '@/components/StepEditor';
import { SectionCard } from '@/components/SectionCard';
import {
  makeStepDraft,
  workflowStepTemplateOptions
} from '@/constants/workflowStepDefaults';
import { AppButton } from '@/components/Button';
import { tokens } from '@/theme/tokens';
import type { WorkflowDraft, WorkflowStepDraft } from '@/types/workflowsV2';

type WorkflowFormProps = {
  draft: WorkflowDraft;
  onChange: (draft: WorkflowDraft) => void;
};

export function WorkflowForm({ draft, onChange }: WorkflowFormProps) {
  const [pendingStepTemplate, setPendingStepTemplate] = useState<string>('none');

  function updateStep(index: number, nextStep: WorkflowStepDraft) {
    const nextSteps = draft.steps.map((step, currentIndex) =>
      currentIndex === index ? nextStep : step
    );
    onChange({ ...draft, steps: nextSteps });
  }

  function removeStep(index: number) {
    const nextSteps = draft.steps.filter((_, currentIndex) => currentIndex !== index);
    onChange({
      ...draft,
      steps: nextSteps.length > 0 ? nextSteps : [makeStepDraft('prompt')]
    });
  }

  function moveStep(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= draft.steps.length) {
      return;
    }

    const nextSteps = [...draft.steps];
    const [current] = nextSteps.splice(index, 1);
    nextSteps.splice(targetIndex, 0, current);
    onChange({ ...draft, steps: nextSteps });
  }

  function addStep(templateKey: keyof typeof import('@/constants/workflowStepDefaults').workflowStepTemplates) {
    onChange({
      ...draft,
      steps: [...draft.steps, makeStepDraft(templateKey)]
    });
  }

  function handleAddStep() {
    if (pendingStepTemplate === 'none') {
      return;
    }

    addStep(
      pendingStepTemplate as keyof typeof import('@/constants/workflowStepDefaults').workflowStepTemplates
    );
    setPendingStepTemplate('none');
  }

  return (
    <>
      <SectionCard title="Workflow basics" description="Keep the mobile form lean and aligned with the existing V2 workflow API.">
        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            onChangeText={(value) => onChange({ ...draft, title: value })}
            placeholder="Workflow title"
            placeholderTextColor={tokens.colors.muted}
            style={styles.input}
            value={draft.title}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Aim</Text>
          <TextInput
            multiline
            numberOfLines={4}
            onChangeText={(value) => onChange({ ...draft, aim: value })}
            placeholder="What is this workflow for?"
            placeholderTextColor={tokens.colors.muted}
            style={[styles.input, styles.textArea]}
            textAlignVertical="top"
            value={draft.aim}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Status</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={(value) => onChange({ ...draft, status: value })}
            placeholder="draft"
            placeholderTextColor={tokens.colors.muted}
            style={styles.input}
            value={draft.status}
          />
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text style={styles.label}>Active</Text>
            <Text style={styles.help}>This maps to the workflow `is_active` flag.</Text>
          </View>
          <Switch
            onValueChange={(value) => onChange({ ...draft, is_active: value })}
            value={draft.is_active}
          />
        </View>
      </SectionCard>

      <SectionCard title="Steps" description="Edit the same fields your current frontend sends to the workflow V2 endpoints.">
        <View style={styles.addStepControls}>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={pendingStepTemplate}
              onValueChange={(value) => setPendingStepTemplate(String(value))}
              style={styles.picker}>
              <Picker.Item label="Select step to add" value="none" />
              {workflowStepTemplateOptions.map((option) => (
                <Picker.Item key={option.key} label={option.label} value={option.key} />
              ))}
            </Picker>
          </View>
          <AppButton
            label="Add step"
            onPress={handleAddStep}
            tone="ghost"
            disabled={pendingStepTemplate === 'none'}
          />
        </View>

        {draft.steps.map((step, index) => (
          <StepEditor
            key={`${index}-${step.title}-${step.step_type}`}
            index={index}
            onChange={(nextStep) => updateStep(index, nextStep)}
            onDelete={() => removeStep(index)}
            onMoveDown={index < draft.steps.length - 1 ? () => moveStep(index, 1) : undefined}
            onMoveUp={index > 0 ? () => moveStep(index, -1) : undefined}
            step={step}
          />
        ))}
      </SectionCard>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: tokens.spacing.xs
  },
  label: {
    color: tokens.colors.text,
    fontSize: 14,
    fontWeight: '600'
  },
  help: {
    color: tokens.colors.muted,
    fontSize: 12
  },
  input: {
    backgroundColor: tokens.colors.inputBackground,
    borderColor: tokens.colors.border,
    borderWidth: 1,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    color: tokens.colors.text,
    fontSize: 15
  },
  textArea: {
    minHeight: 88
  },
  addStepControls: {
    gap: tokens.spacing.sm
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: tokens.colors.border,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.inputBackground,
    overflow: 'hidden'
  },
  picker: {
    color: tokens.colors.text
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.md
  },
  switchText: {
    flex: 1,
    gap: tokens.spacing.xs
  }
});
