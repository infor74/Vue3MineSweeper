<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRaw } from "vue";
import Game, { GameStatus } from "@/class/game";
import { GameLevel, type GameLevelConfig } from "@/class/game-level";

import { ElButton, ElButtonGroup, ElMessageBox, ElIcon, ElTag } from 'element-plus';
import { Clock, Flag, QuestionFilled } from '@element-plus/icons-vue'

type CurrentGameLevel = GameLevelConfig

const currentLevel = ref<CurrentGameLevel>(GameLevel.normal)
const game = ref(new Game(toRaw(currentLevel.value), ElMessageBox));

const restartButtonDisabled = computed(() => {
  return game.value.status === GameStatus.Ready
})

onBeforeUnmount(() => {
  game.value?.stopTimer();
})

function toggleLevel(level: CurrentGameLevel) {
  if(!game.value) {
    return
  }
  game.value.stop();
  currentLevel.value = level;
  game.value = new Game(level, ElMessageBox);
}

</script>

<template>
  <div
      class="container"
  >
    <section class="difficulty-panel">
      <div class="difficulty-heading">
        <span class="difficulty-label">难度</span>
        <span class="difficulty-details">
          {{ currentLevel.text }} · {{ currentLevel.r }} × {{ currentLevel.c }} · {{ currentLevel.m }} 雷
        </span>
      </div>
      <el-button-group class="difficulty-options">
        <template v-for="level of GameLevel">
          <el-button
              :type="currentLevel.text === level.text ? 'primary' : 'default'"
              :plain="currentLevel.text !== level.text"
              @click="() => toggleLevel(level)"
          >{{level.text}}</el-button>
        </template>
      </el-button-group>
    </section>
    <table class="head">
      <thead>
        <tr>
        <td width="50%"
            align="left"
        >
          <el-tag
              v-show="game.status !== GameStatus.Ready"
              type="danger"
              effect="light"
              class="game-indicator"
          >
            <el-icon><Flag /></el-icon>
            <span>剩余地雷：{{ game.unmarkMines }}</span>
          </el-tag>
        </td>
        <td align="center">
          <el-button
              :disabled="restartButtonDisabled"
              @click="() => game.reset()">重新开始</el-button>
        </td>
        <td width="50%"
            align="right"
        >
          <el-tag
              v-show="game.status !== GameStatus.Ready"
              type="info"
              effect="light"
              class="game-indicator"
          >
            <el-icon><Clock /></el-icon>
            <span>耗时：{{ game.timerSeconds }} 秒</span>
          </el-tag>
        </td>
      </tr>
      </thead>
    </table>
    <div v-if="game.grid.length" class="grid-scroll">
      <table
          class="grid-table"
          @click.right.prevent.stop="() => {}"
      >
        <tbody>
          <tr v-for="(row, i) in game.grid"
              :key="i"
          >
            <td v-for="(cell, j) in row"
                :key="j"
                :class="`cell ${cell.opened ? 'opened' : 'default'} ${cell.mark}`"
                @click.left="() => cell.handleLeftClick(game)"
                @click.right.prevent="() => cell.handleRightClick(game)"
            >
                <span
                    v-if="cell.opened && cell.adjacentMines"
                >{{ cell.adjacentMines }}</span>
              <el-icon
                  v-if="cell.mark !== 'none'"
              >
                <Flag v-if="cell.mark === 'flag'" color="red" />
                <QuestionFilled v-if="cell.mark === 'question'" color="sandybrown" />
              </el-icon>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$dark-border: #909399;
$light-border: #f1f1f1;
$border-width: 4px;
$bg: #d3d4d6;
$text-primary: #303133;
$text-secondary: #606266;
$cell-active-bg: #f5f7fa;
$cell-open-border: #a8abb2;
$spacing: 8px;

.container {
  display: flex;
  flex-flow: column nowrap;
  align-items: stretch;
  justify-content: center;
  background: $bg;
  border-radius: 4px;
  padding: $spacing;
  border: $border-width solid;
  border-color: $light-border $dark-border $dark-border $light-border;
}

.head {
  margin: 0 0 $spacing;
  padding: 0;
}

.difficulty-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: $spacing;
  border-radius: var(--el-border-radius-base);
  background: $bg;
}

.difficulty-heading {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  text-align: left;
}

.difficulty-label {
  color: $text-primary;
  font-size: 14px;
  font-weight: 600;
}

.difficulty-details {
  color: $text-secondary;
  font-size: 12px;
}

.difficulty-options {
  display: flex;
  flex: 0 0 auto;
}

.difficulty-options :deep(.el-button) {
  width: 76px;
}

.game-indicator {
  height: 32px;
  font-variant-numeric: tabular-nums;
  vertical-align: middle;

  :deep(.el-tag__content) {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
  }
}

table {
  table-layout: fixed;
}

.grid-scroll {
  max-width: 100%;
  overflow-x: auto;
}

.grid-table {
  min-width: 400px;
  min-height: 400px;
  border-radius: 4px;
  border: $border-width solid;
  border-color: $dark-border $light-border $light-border $dark-border;
}

.cell {
  width: 32px;
  min-width: 32px;
  height: 32px;
  min-height: 32px;
  padding: 0; /* 清除默认内边距！非常关键 */
  text-align: center;
  box-sizing: border-box;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  line-height: 1em;
  user-select: none;

  &.default {
    background-color: $bg;
    border: $border-width solid;
    border-color: $light-border $dark-border $dark-border $light-border;

    &:active {
      background-color: $cell-active-bg;
      border-color: $dark-border $light-border $light-border $dark-border;
    }
  }

  &.opened {
    border: 2px dashed $cell-open-border;
  }
}
</style>
