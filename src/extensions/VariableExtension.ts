import { Node, mergeAttributes } from '@tiptap/core'

export interface VariableOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    insertVariable: {
      
      insertVariable: (variable: { id: string; value: string }) => ReturnType
    }
  }
}

export const VariableExtension = Node.create<VariableOptions>({
  name: 'variable',

  group: 'inline',

  inline: true,

  addAttributes() {
    return {
      id: {
        default: null,
      },
      value: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span.mention' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), HTMLAttributes.value]
  },

  addCommands() {
    return {
      insertVariable:
        (variable) =>
        ({ chain }) => {
          return chain()
            .focus()
            .insertContent(`<span class="mention bg-blue-100 text-blue-600 px-2 py-1 rounded">${variable.value}</span>&nbsp;`)
            .run()
        },
    }
  },
})
