import type { PageSnapshot, VisualPatternGroup } from '../types';
import { computePerceptualHash, pHashSimilarity, computeSSIM } from './image-comparator';
import { computeDomSimilarity } from './dom-comparator';
import { getPatternColor } from '../constants/colors';

interface ClassificationResult {
  groups: VisualPatternGroup[];
}

// Phase 1: Group by pHash (fast, rough)
async function groupByPHash(
  snapshots: PageSnapshot[],
  threshold: number = 0.85,
): Promise<Map<string, PageSnapshot[]>> {
  const groups = new Map<string, PageSnapshot[]>();
  const hashes = new Map<string, string>();

  // Compute hashes for all snapshots with screenshots
  for (const snap of snapshots) {
    if (!snap.screenshotBase64 && !snap.screenshotUrl) continue;
    const imageUrl = snap.screenshotUrl || snap.screenshotBase64!;
    try {
      const hash = await computePerceptualHash(imageUrl);
      hashes.set(snap.url, hash);
    } catch {
      // Skip images that can't be hashed
    }
  }

  // Group by similar hashes
  const assigned = new Set<string>();

  for (const [url1, hash1] of hashes) {
    if (assigned.has(url1)) continue;

    const group: PageSnapshot[] = [snapshots.find((s) => s.url === url1)!];
    assigned.add(url1);

    for (const [url2, hash2] of hashes) {
      if (assigned.has(url2)) continue;
      const sim = pHashSimilarity(hash1, hash2);
      if (sim >= threshold) {
        group.push(snapshots.find((s) => s.url === url2)!);
        assigned.add(url2);
      }
    }

    groups.set(url1, group);
  }

  return groups;
}

// Phase 2: Refine with SSIM (slower, precise)
async function refineWithSSIM(
  groups: Map<string, PageSnapshot[]>,
  threshold: number = 0.75,
): Promise<Map<string, PageSnapshot[]>> {
  const refined = new Map<string, PageSnapshot[]>();

  for (const [representative, members] of groups) {
    if (members.length <= 1) {
      refined.set(representative, members);
      continue;
    }

    const repSnap = members[0];
    const repImg = repSnap.screenshotUrl || repSnap.screenshotBase64;
    if (!repImg) {
      refined.set(representative, members);
      continue;
    }

    const confirmed: PageSnapshot[] = [repSnap];
    const rejected: PageSnapshot[] = [];

    for (let i = 1; i < members.length; i++) {
      const memberImg = members[i].screenshotUrl || members[i].screenshotBase64;
      if (!memberImg) {
        rejected.push(members[i]);
        continue;
      }

      try {
        const ssim = await computeSSIM(repImg, memberImg);
        if (ssim >= threshold) {
          confirmed.push(members[i]);
        } else {
          rejected.push(members[i]);
        }
      } catch {
        rejected.push(members[i]);
      }
    }

    refined.set(representative, confirmed);

    // Create new groups for rejected items
    for (const rej of rejected) {
      refined.set(rej.url, [rej]);
    }
  }

  return refined;
}

// Phase 3: Enhance with DOM similarity
function enhanceWithDomSimilarity(
  groups: Map<string, PageSnapshot[]>,
  threshold: number = 0.6,
): Map<string, PageSnapshot[]> {
  const enhanced = new Map<string, PageSnapshot[]>();
  const ungrouped: PageSnapshot[] = [];

  // Collect single-member groups to try DOM-based grouping
  for (const [key, members] of groups) {
    if (members.length > 1) {
      enhanced.set(key, members);
    } else {
      ungrouped.push(members[0]);
    }
  }

  // Try to merge ungrouped by DOM similarity
  const domAssigned = new Set<string>();

  for (let i = 0; i < ungrouped.length; i++) {
    if (domAssigned.has(ungrouped[i].url)) continue;
    if (!ungrouped[i].domStructure) {
      enhanced.set(ungrouped[i].url, [ungrouped[i]]);
      continue;
    }

    const group: PageSnapshot[] = [ungrouped[i]];
    domAssigned.add(ungrouped[i].url);

    for (let j = i + 1; j < ungrouped.length; j++) {
      if (domAssigned.has(ungrouped[j].url)) continue;
      if (!ungrouped[j].domStructure) continue;

      const sim = computeDomSimilarity(
        ungrouped[i].domStructure!,
        ungrouped[j].domStructure!,
      );

      if (sim >= threshold) {
        group.push(ungrouped[j]);
        domAssigned.add(ungrouped[j].url);
      }
    }

    enhanced.set(ungrouped[i].url, group);
  }

  return enhanced;
}

// --- Main Classification Pipeline ---
export async function classifyVisualPatterns(
  snapshots: PageSnapshot[],
  onProgress?: (stage: string, progress: number) => void,
): Promise<ClassificationResult> {
  const validSnapshots = snapshots.filter(
    (s) => s.status === 'success' && (s.screenshotBase64 || s.screenshotUrl),
  );

  if (validSnapshots.length === 0) {
    return { groups: [] };
  }

  // Phase 1: pHash grouping
  onProgress?.('pHash による高速グルーピング中...', 0.2);
  let groups = await groupByPHash(validSnapshots);

  // Phase 2: SSIM refinement
  onProgress?.('SSIM による精密比較中...', 0.5);
  groups = await refineWithSSIM(groups);

  // Phase 3: DOM enhancement
  onProgress?.('DOM構造による補助分類中...', 0.8);
  groups = enhanceWithDomSimilarity(groups);

  // Convert to VisualPatternGroup[]
  const result: VisualPatternGroup[] = [];
  let colorIdx = 0;

  for (const [representative, members] of groups) {
    if (members.length < 2) continue; // Skip single-page "groups"

    const repSnap = members.find((m) => m.url === representative) || members[0];
    const hasDom = members.some((m) => m.domStructure);
    const hasScreenshot = members.some((m) => m.screenshotBase64 || m.screenshotUrl);

    let explanation = `これらの${members.length}件のページは`;
    if (hasScreenshot && hasDom) {
      explanation += '、スクリーンショットの見た目とDOM構造の両方が類似しています。';
    } else if (hasScreenshot) {
      explanation += '、スクリーンショットの見た目が類似しています。';
    } else if (hasDom) {
      explanation += '、DOM構造が類似しています。';
    }
    explanation += `代表ページ: ${repSnap.url}`;

    result.push({
      id: `visual-pattern-${colorIdx}`,
      label: `ビジュアルパターン ${colorIdx + 1}`,
      color: getPatternColor(colorIdx),
      ssimThreshold: 0.75,
      domSimilarity: 0.6,
      urls: members.map((m) => m.url),
      representativeScreenshot: repSnap.screenshotBase64 || repSnap.screenshotUrl,
      explanation,
    });

    colorIdx++;
  }

  onProgress?.('分類完了', 1);
  return { groups: result };
}
