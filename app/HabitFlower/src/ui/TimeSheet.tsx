import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { parseTime } from '@/domain/day';
import { minutesToTime } from '@/domain/windows';
import { colors } from '@/theme/tokens';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { Text } from './Text';

function toDate(t: string): Date {
  const d = new Date();
  const m = parseTime(t);
  d.setHours(Math.floor(m / 60), m % 60, 0, 0);
  return d;
}

const fromDate = (d: Date) => minutesToTime(d.getHours() * 60 + d.getMinutes());

function Spinner({ value, onChange, label }: { value: string; onChange: (t: string) => void; label: string }) {
  // The iOS spinner sizes to its content and hugs the left edge; centre it in the sheet.
  return (
    <View style={{ alignSelf: 'stretch', alignItems: 'center' }}>
      <DateTimePicker
        accessibilityLabel={label}
        value={toDate(value)}
        mode="time"
        display="spinner"
        minuteInterval={5}
        themeVariant="dark"
        textColor={colors.text}
        onChange={(_, d) => d && onChange(fromDate(d))}
        style={{ height: 180 }}
      />
    </View>
  );
}

export function TimeSheet({ visible, title, initial, onClose, onDone }: { visible: boolean; title: string; initial: string; onClose: () => void; onDone: (t: string) => void }) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    if (visible) setValue(initial);
  }, [visible, initial]);
  return (
    <Sheet visible={visible} onClose={onClose} title={title} dragFromContent={false} footer={<Button title="Done" variant="light" flex onPress={() => onDone(value)} />}>
      <Spinner value={value} onChange={setValue} label={title} />
    </Sheet>
  );
}

export function WindowSheet({
  visible,
  initial,
  onClose,
  onDone,
}: {
  visible: boolean;
  initial: { start: string; end: string };
  onClose: () => void;
  onDone: (w: { start: string; end: string }) => void;
}) {
  const [start, setStart] = useState(initial.start);
  const [end, setEnd] = useState(initial.end);
  useEffect(() => {
    if (visible) {
      setStart(initial.start);
      setEnd(initial.end);
    }
  }, [visible, initial.start, initial.end]);
  const valid = parseTime(end) > parseTime(start);
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      dragFromContent={false}
      title="Check-in window"
      footer={<Button title="Done" variant="light" flex disabled={!valid} onPress={() => onDone({ start, end })} />}
    >
      <View style={{ gap: 4 }}>
        <Text label align="center">
          Opens
        </Text>
        <Spinner value={start} onChange={setStart} label="Opens" />
      </View>
      <View style={{ gap: 4 }}>
        <Text label align="center">
          Closes
        </Text>
        <Spinner value={end} onChange={setEnd} label="Closes" />
      </View>
      {!valid ? (
        <Text size={13.5} weight={500} color={colors.wilting}>
          The window has to close after it opens.
        </Text>
      ) : null}
    </Sheet>
  );
}
