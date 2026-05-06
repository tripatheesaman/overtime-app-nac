ALTER TABLE settings
  ADD COLUMN config JSON NULL;

UPDATE settings
SET config = JSON_OBJECT(
  'normal', JSON_OBJECT('dayBeforeOffReductionHours', COALESCE(dayBeforeOffReductionHours, 2)),
  'cutoffThresholds', JSON_OBJECT(
    'inTimeThreshold', COALESCE(inTimeThreshold, 30),
    'outTimeThreshold', COALESCE(outTimeThreshold, 30),
    'specialWindowStart', COALESCE(specialWindowStart, '04:50'),
    'specialWindowEnd', COALESCE(specialWindowEnd, '06:00'),
    'specialWindowLowerCutoff', COALESCE(specialWindowLowerCutoff, '05:15'),
    'specialWindowUpperCutoff', COALESCE(specialWindowUpperCutoff, '05:35'),
    'oddShiftDayMinHours', 0,
    'oddShiftNightMinHours', COALESCE(oddShiftMinHours, 0),
    'afterDutyGraceMinutes', COALESCE(overtimeGraceMinutes, 40)
  ),
  'shifts', JSON_OBJECT(
    'enableNightDuty', true,
    'enableMorningShift', true
  ),
  'winterOverlay', JSON_OBJECT(
    'enabled', COALESCE(isWinter, false),
    'range', JSON_OBJECT('startDay', COALESCE(winterStartDay, 1), 'endDay', COALESCE(winterEndDay, 31))
  ),
  'doubleOffOverlay', JSON_OBJECT(
    'enabled', false,
    'range', JSON_OBJECT('startDay', COALESCE(doubleOffdayStartDay, 23), 'endDay', 31)
  ),
  'noFridayOverlay', JSON_OBJECT(
    'enabled', false,
    'range', JSON_OBJECT('startDay', 1, 'endDay', 31)
  ),
  'eightHourOverlay', JSON_OBJECT(
    'enabled', false,
    'range', JSON_OBJECT('startDay', 1, 'endDay', 31),
    'defaults', JSON_OBJECT(
      'regularIn', '09:00',
      'regularOut', '17:00',
      'nightIn', '22:00',
      'nightOut', '06:00',
      'morningIn', '06:00',
      'morningOut', '14:00'
    )
  ),
  'placeholders', JSON_OBJECT(
    'normal', JSON_OBJECT(
      'regularIn', '10:00',
      'regularOut', '17:00',
      'nightIn', '17:00',
      'nightOut', '00:00',
      'morningIn', '05:30',
      'morningOut', '12:30'
    ),
    'winter', JSON_OBJECT(
      'regularIn', '10:00',
      'regularOut', '17:00',
      'nightIn', '17:00',
      'nightOut', '00:00',
      'morningIn', '05:30',
      'morningOut', '12:30'
    )
  )
)
WHERE id = 1;
