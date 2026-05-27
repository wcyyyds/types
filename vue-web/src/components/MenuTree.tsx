import { defineComponent, h } from 'vue'
import type { PropType } from 'vue'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import type { MenuInfo } from '@/types'

/** 图标映射 — 自动注册所有 Element Plus 图标 */
const iconMap: Record<string, any> = ElementPlusIcons

export default defineComponent({
  name: 'MenuTree',
  props: {
    menus: {
      type: Array as PropType<MenuInfo[]>,
      required: true,
    },
  },
  setup(props) {
    const renderIcon = (iconName?: string) => {
      if (!iconName || !iconMap[iconName]) return null
      return <el-icon>{h(iconMap[iconName])}</el-icon>
    }

    const renderMenu = (menus: MenuInfo[]) => {
      return menus.map((menu) => {
        const icon = renderIcon(menu.icon)
        if (menu.children && menu.children.length > 0) {
          return (
            <el-sub-menu index={menu.path || String(menu.id)}>
              {{
                title: () => (
                  <>
                    {icon}
                    <span>{menu.title}</span>
                  </>
                ),
                default: () => renderMenu(menu.children!),
              }}
            </el-sub-menu>
          )
        }
        return (
          <el-menu-item index={menu.path || String(menu.id)}>
            {icon}
            <span>{menu.title}</span>
          </el-menu-item>
        )
      })
    }

    return () => <>{renderMenu(props.menus)}</>
  },
})
