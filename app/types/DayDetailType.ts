export interface DepartmentInfo {
    id: number;
    name: string;
    templateFile: string;
}

export interface DayDetailsType {
    startDay: number
    holidays: number[]
    numberOfDays: number
    name: string
    year: number
    monthNumber: number
    isDashainMonth?: boolean
    dashainDays?: number[]
    isTiharMonth?: boolean
    tiharDays?: number[]
    departmentId?: number
    department?: DepartmentInfo
    regularInPlaceholder?: string | null
    regularOutPlaceholder?: string | null
    morningInPlaceholder?: string | null
    morningOutPlaceholder?: string | null
    nightInPlaceholder?: string | null
    nightOutPlaceholder?: string | null
    winterRegularInPlaceholder?: string | null
    winterRegularOutPlaceholder?: string | null
    winterMorningInPlaceholder?: string | null
    winterMorningOutPlaceholder?: string | null
    winterNightInPlaceholder?: string | null
    winterNightOutPlaceholder?: string | null
}
