import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Pagination } from './Pagination'

const meta = {
  title: 'Componenti/Pagination',
  component: Pagination,
  args: { page: 5, totalPages: 90, hrefFor: (p: number) => `/avvisi?pagina=${p}` },
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

export const Centrale: Story = {}
export const PrimaPagina: Story = { args: { page: 1 } }
export const UltimaPagina: Story = { args: { page: 90 } }
export const PochePagine: Story = { args: { page: 2, totalPages: 3 } }
