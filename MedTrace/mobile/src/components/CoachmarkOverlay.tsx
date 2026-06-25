import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTour } from '../context/TourContext';
import { useAuth } from '../context/AuthContext';

interface Rect { x: number; y: number; width: number; height: number }
const EMPTY: Rect = { x: 0, y: 0, width: 0, height: 0 };
const PAD = 10;
const TOOLTIP_W = 280;
const TOOLTIP_H_APPROX = 160;
const BORDER_RADIUS = 12;

const BROWN       = '#7c5c3a';
const CREAM       = '#fdf6ec';
const AMBER       = '#a07840';
const OVERLAY_CLR = 'rgba(0,0,0,0.65)';

function useWindowDims() {
  const [dims, setDims] = useState(Dimensions.get('window'));
  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);
  return dims;
}

export default function CoachmarkOverlay() {
  const { isActive, currentIndex, steps, next, back, endTour, skipTour } = useTour();
  const { user } = useAuth();
  const dims    = useWindowDims();
  const [rect, setRect] = useState<Rect>(EMPTY);
  const measuring = useRef(false);

  const step = steps[currentIndex];

  const measureStep = useCallback(() => {
    if (!step?.ref?.current) {
      setRect(EMPTY);
      return;
    }
    if (measuring.current) return;
    measuring.current = true;
    step.ref.current.measureInWindow((x, y, width, height) => {
      measuring.current = false;
      if (width === 0 && height === 0) {
        setRect(EMPTY);
      } else {
        setRect({ x, y, width, height });
      }
    });
  }, [step]);

  useEffect(() => {
    if (!isActive) { setRect(EMPTY); return; }
    // Small delay lets the layout settle before we measure
    const t = setTimeout(measureStep, 80);
    return () => clearTimeout(t);
  }, [isActive, currentIndex, measureStep]);

  if (!isActive || !step) return null;

  const userId = user?.id ? String(user.id) : '';
  const isFirst = currentIndex === 0;
  const isLast  = currentIndex === steps.length - 1;
  const hasSpotlight = rect.width > 0 && rect.height > 0;

  // Spotlight rect with padding
  const sp: Rect = hasSpotlight
    ? {
        x:      rect.x - PAD,
        y:      rect.y - PAD,
        width:  rect.width  + PAD * 2,
        height: rect.height + PAD * 2,
      }
    : EMPTY;

  // Where to place the tooltip
  let tooltipLeft = hasSpotlight ? sp.x + sp.width / 2 - TOOLTIP_W / 2 : dims.width / 2 - TOOLTIP_W / 2;
  tooltipLeft = Math.max(12, Math.min(tooltipLeft, dims.width - TOOLTIP_W - 12));

  const spBottom = hasSpotlight ? sp.y + sp.height : 0;
  const spaceBelow = dims.height - spBottom - 20;
  const putBelow   = hasSpotlight && spaceBelow > TOOLTIP_H_APPROX + 20;
  const putAbove   = hasSpotlight && !putBelow && sp.y > TOOLTIP_H_APPROX + 20;

  let tooltipTop: number;
  if (!hasSpotlight) {
    tooltipTop = dims.height / 2 - TOOLTIP_H_APPROX / 2;
  } else if (putBelow) {
    tooltipTop = spBottom + 16;
  } else if (putAbove) {
    tooltipTop = sp.y - TOOLTIP_H_APPROX - 16;
  } else {
    tooltipTop = dims.height / 2 - TOOLTIP_H_APPROX / 2;
  }

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      {/* Full-screen dark overlay split into 4 rects around the spotlight */}
      {hasSpotlight ? (
        <>
          {/* Top */}
          <View style={[StyleSheet.absoluteFill, { height: sp.y, backgroundColor: OVERLAY_CLR }]} />
          {/* Bottom */}
          <View style={[StyleSheet.absoluteFill, { top: sp.y + sp.height, backgroundColor: OVERLAY_CLR }]} />
          {/* Left */}
          <View style={{
            position: 'absolute',
            top: sp.y, left: 0,
            width: sp.x, height: sp.height,
            backgroundColor: OVERLAY_CLR,
          }} />
          {/* Right */}
          <View style={{
            position: 'absolute',
            top: sp.y, left: sp.x + sp.width,
            right: 0, height: sp.height,
            backgroundColor: OVERLAY_CLR,
          }} />
          {/* Spotlight border ring */}
          <View style={{
            position: 'absolute',
            top: sp.y, left: sp.x,
            width: sp.width, height: sp.height,
            borderRadius: BORDER_RADIUS,
            borderWidth: 2,
            borderColor: 'rgba(168,137,95,0.85)',
          }} pointerEvents="none" />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: OVERLAY_CLR }]} />
      )}

      {/* Tooltip card */}
      <View style={[styles.tooltip, { top: tooltipTop, left: tooltipLeft, width: TOOLTIP_W }]}>
        {/* Arrow pointing up toward spotlight when tooltip is below */}
        {putBelow && (
          <View style={[styles.arrowUp, { left: Math.min(TOOLTIP_W - 32, Math.max(16, sp.x + sp.width / 2 - tooltipLeft - 8)) }]} />
        )}
        {/* Arrow pointing down when tooltip is above */}
        {putAbove && (
          <View style={[styles.arrowDown, { left: Math.min(TOOLTIP_W - 32, Math.max(16, sp.x + sp.width / 2 - tooltipLeft - 8)) }]} />
        )}

        <Text style={styles.stepCount}>{currentIndex + 1} / {steps.length}</Text>
        <Text style={styles.title}>{step.title}</Text>
        <Text style={styles.description}>{step.description}</Text>

        <View style={styles.controls}>
          <Pressable onPress={() => skipTour(userId)} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
          <View style={styles.navRow}>
            {!isFirst && (
              <Pressable onPress={back} style={[styles.navBtn, styles.backBtn]}>
                <Text style={styles.backText}>Back</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => isLast ? endTour(userId) : next()}
              style={[styles.navBtn, styles.nextBtn]}
            >
              <Text style={styles.nextText}>{isLast ? 'Done' : 'Next'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    backgroundColor: CREAM,
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  arrowUp: {
    position: 'absolute',
    top: -9,
    width: 0, height: 0,
    borderLeftWidth: 9, borderLeftColor: 'transparent',
    borderRightWidth: 9, borderRightColor: 'transparent',
    borderBottomWidth: 9, borderBottomColor: CREAM,
  },
  arrowDown: {
    position: 'absolute',
    bottom: -9,
    width: 0, height: 0,
    borderLeftWidth: 9, borderLeftColor: 'transparent',
    borderRightWidth: 9, borderRightColor: 'transparent',
    borderTopWidth: 9, borderTopColor: CREAM,
  },
  stepCount: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
    fontSize: 11,
    color: AMBER,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' }),
    fontSize: 18,
    fontWeight: '700',
    color: BROWN,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4a3728',
    marginBottom: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipBtn: { padding: 4 },
  skipText: { fontSize: 13, color: '#999' },
  navRow: { flexDirection: 'row', gap: 8 },
  navBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: BROWN,
  },
  backText: { fontSize: 14, color: BROWN, fontWeight: '600' },
  nextBtn: { backgroundColor: BROWN },
  nextText: { fontSize: 14, color: '#fff', fontWeight: '600' },
});
