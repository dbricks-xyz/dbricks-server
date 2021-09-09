export interface Settlement {
    settle: () => Promise<any>
}