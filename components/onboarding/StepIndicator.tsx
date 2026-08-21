import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Colors, Spacing } from '@/constants/theme'
import { AppText } from '@/components/primitives/AppText'
import { Check } from 'lucide-react-native'

interface StepIndicatorProps {
  currentStep: number // 1, 2, 3, or 4
  totalSteps?: number
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  totalSteps = 4,
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step, index) => {
        const isCompleted = step < currentStep
        const isCurrent = step === currentStep
        const isLast = index === totalSteps - 1

        return (
          <React.Fragment key={step}>
            {/* Step Circle */}
            <View
              style={[
                styles.circle,
                isCompleted ? styles.circleCompleted : null,
                isCurrent ? styles.circleCurrent : null,
              ]}
            >
              {isCompleted ? (
                <Check color={Colors.surface} size={14} strokeWidth={3} />
              ) : (
                <AppText
                  variant="caption"
                  weight="bold"
                  color={isCurrent ? Colors.surface : Colors.textMuted}
                >
                  {String(step)}
                </AppText>
              )}
            </View>

            {/* Connecting Line */}
            {!isLast && (
              <View
                style={[
                  styles.line,
                  isCompleted ? styles.lineCompleted : null,
                ]}
              />
            )}
          </React.Fragment>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  circleCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  circleCompleted: {
    backgroundColor: Colors.primary,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 6,
  },
  lineCompleted: {
    backgroundColor: Colors.primary,
  },
})
