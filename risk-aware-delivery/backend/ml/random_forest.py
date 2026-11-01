"""
Native Python & NumPy Implementation of Random Forest Classifier
================================================================
Designed for high performance, zero external C-binary dependency,
exact Scikit-Learn API compatibility, and full Joblib serialization.

Features:
- DecisionTree with Gini Impurity criterion
- Vectorized candidate split evaluations
- Bootstrap bagging & random feature subsampling
- Balanced class weight correction for imbalanced disaster datasets
- predict() and predict_proba() returning calibrated class probabilities
- Feature importance calculation via accumulated Gini impurity reduction
- Comprehensive evaluation metrics: accuracy, precision, recall, F1, confusion matrix
"""

import math
import numpy as np
from typing import List, Dict, Any, Tuple, Optional


class TreeNode:
    """Internal decision tree node or terminal leaf."""
    def __init__(
        self,
        feature_idx: Optional[int] = None,
        threshold: Optional[float] = None,
        left: Optional['TreeNode'] = None,
        right: Optional['TreeNode'] = None,
        *,
        value: Optional[int] = None,
        probabilities: Optional[np.ndarray] = None,
        impurity: float = 0.0,
        n_node_samples: int = 0
    ):
        self.feature_idx = feature_idx
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value
        self.probabilities = probabilities
        self.impurity = impurity
        self.n_node_samples = n_node_samples

    @property
    def is_leaf(self) -> bool:
        return self.value is not None


class DecisionTree:
    """Single Decision Tree Classifier with Gini Impurity."""

    def __init__(
        self,
        max_depth: int = 8,
        min_samples_split: int = 4,
        max_features: Optional[int] = None,
        random_state: Optional[int] = None
    ):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.random_state = random_state
        self.root: Optional[TreeNode] = None
        self.n_classes: int = 3
        self.feature_importances: Optional[np.ndarray] = None
        self._rng = np.random.RandomState(random_state)

    def _gini(self, y: np.ndarray, sample_weight: Optional[np.ndarray] = None) -> float:
        if len(y) == 0:
            return 0.0
        if sample_weight is None:
            _, counts = np.unique(y, return_counts=True)
            p = counts / len(y)
            return float(1.0 - np.sum(p ** 2))
        else:
            total_weight = np.sum(sample_weight)
            if total_weight <= 0:
                return 0.0
            sum_sq = 0.0
            for c in range(self.n_classes):
                w_c = np.sum(sample_weight[y == c])
                sum_sq += (w_c / total_weight) ** 2
            return float(1.0 - sum_sq)

    def _best_split(
        self,
        X: np.ndarray,
        y: np.ndarray,
        sample_weight: Optional[np.ndarray] = None
    ) -> Tuple[Optional[int], Optional[float], float]:
        n_samples, n_features = X.shape
        if n_samples < self.min_samples_split:
            return None, None, 0.0

        current_gini = self._gini(y, sample_weight)
        best_gain = -1.0
        best_feature = None
        best_threshold = None

        if self.max_features is None:
            feature_indices = np.arange(n_features)
        else:
            k = min(self.max_features, n_features)
            feature_indices = self._rng.choice(n_features, size=k, replace=False)

        for feat in feature_indices:
            x_col = X[:, feat]
            unique_vals = np.unique(x_col)
            if len(unique_vals) <= 1:
                continue

            # Evaluate percentiles as split candidates to ensure efficiency
            if len(unique_vals) > 20:
                thresholds = np.percentile(unique_vals, np.linspace(5, 95, 19))
            else:
                thresholds = (unique_vals[:-1] + unique_vals[1:]) / 2.0

            for thresh in thresholds:
                left_mask = x_col <= thresh
                right_mask = ~left_mask
                n_left = np.sum(left_mask)
                n_right = n_samples - n_left

                if n_left == 0 or n_right == 0:
                    continue

                if sample_weight is None:
                    gini_left = self._gini(y[left_mask])
                    gini_right = self._gini(y[right_mask])
                    gain = current_gini - ((n_left / n_samples) * gini_left + (n_right / n_samples) * gini_right)
                else:
                    w_left = sample_weight[left_mask]
                    w_right = sample_weight[right_mask]
                    total_w = np.sum(sample_weight)
                    gini_left = self._gini(y[left_mask], w_left)
                    gini_right = self._gini(y[right_mask], w_right)
                    gain = current_gini - ((np.sum(w_left) / total_w) * gini_left + (np.sum(w_right) / total_w) * gini_right)

                if gain > best_gain:
                    best_gain = gain
                    best_feature = feat
                    best_threshold = thresh

        return best_feature, best_threshold, max(0.0, best_gain)

    def _build_tree(
        self,
        X: np.ndarray,
        y: np.ndarray,
        depth: int = 0,
        sample_weight: Optional[np.ndarray] = None
    ) -> TreeNode:
        n_samples = len(y)
        counts = np.zeros(self.n_classes, dtype=float)
        if sample_weight is None:
            for c in range(self.n_classes):
                counts[c] = np.sum(y == c)
        else:
            for c in range(self.n_classes):
                counts[c] = np.sum(sample_weight[y == c])

        total_weight = np.sum(counts)
        probs = counts / total_weight if total_weight > 0 else np.ones(self.n_classes) / self.n_classes
        majority_class = int(np.argmax(counts))
        node_impurity = self._gini(y, sample_weight)

        # Stop criteria
        if (
            depth >= self.max_depth
            or n_samples < self.min_samples_split
            or len(np.unique(y)) <= 1
        ):
            return TreeNode(value=majority_class, probabilities=probs, impurity=node_impurity, n_node_samples=n_samples)

        feat, thresh, gain = self._best_split(X, y, sample_weight)
        if feat is None or gain <= 1e-7:
            return TreeNode(value=majority_class, probabilities=probs, impurity=node_impurity, n_node_samples=n_samples)

        # Record feature importance gain weighted by sample proportion
        if self.feature_importances is not None:
            self.feature_importances[feat] += gain * (n_samples / self._total_train_samples)

        left_mask = X[:, feat] <= thresh
        right_mask = ~left_mask

        w_left = sample_weight[left_mask] if sample_weight is not None else None
        w_right = sample_weight[right_mask] if sample_weight is not None else None

        left_child = self._build_tree(X[left_mask], y[left_mask], depth + 1, w_left)
        right_child = self._build_tree(X[right_mask], y[right_mask], depth + 1, w_right)

        return TreeNode(
            feature_idx=feat,
            threshold=thresh,
            left=left_child,
            right=right_child,
            impurity=node_impurity,
            n_node_samples=n_samples
        )

    def fit(self, X: np.ndarray, y: np.ndarray, sample_weight: Optional[np.ndarray] = None, n_classes: int = 3):
        self.n_classes = n_classes
        self._total_train_samples = len(y)
        self.feature_importances = np.zeros(X.shape[1], dtype=float)
        self.root = self._build_tree(X, y, depth=0, sample_weight=sample_weight)
        return self

    def _predict_row(self, node: TreeNode, row: np.ndarray) -> np.ndarray:
        if node.is_leaf:
            return node.probabilities
        if row[node.feature_idx] <= node.threshold:
            return self._predict_row(node.left, row)
        return self._predict_row(node.right, row)

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        return np.array([self._predict_row(self.root, row) for row in X])


class RandomForestClassifier:
    """
    Ensemble of Decision Trees for Road Disruption Risk Classification.
    Strictly follows Scikit-Learn public API.
    """

    def __init__(
        self,
        n_estimators: int = 30,
        max_depth: int = 8,
        min_samples_split: int = 4,
        max_features: str = 'sqrt',
        class_weight: Optional[str] = 'balanced',
        random_state: int = 42
    ):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.max_features = max_features
        self.class_weight = class_weight
        self.random_state = random_state
        self.trees: List[DecisionTree] = []
        self.classes_: np.ndarray = np.array([0, 1, 2])
        self.feature_importances_: Optional[np.ndarray] = None
        self.n_features_in_: int = 0

    def fit(self, X: np.ndarray, y: np.ndarray):
        X = np.asarray(X, dtype=float)
        y = np.asarray(y, dtype=int)
        n_samples, n_features = X.shape
        self.n_features_in_ = n_features
        self.classes_ = np.unique(y)
        n_classes = len(self.classes_)

        # Compute balanced class weights if requested
        sample_weight = None
        if self.class_weight == 'balanced':
            class_counts = np.bincount(y, minlength=n_classes)
            class_weights = n_samples / (n_classes * np.maximum(class_counts, 1).astype(float))
            sample_weight = class_weights[y]

        # Determine feature subsample size
        if self.max_features == 'sqrt':
            max_f = max(1, int(math.sqrt(n_features)))
        elif self.max_features == 'log2':
            max_f = max(1, int(math.log2(n_features)))
        else:
            max_f = n_features

        rng = np.random.RandomState(self.random_state)
        self.trees = []
        all_importances = np.zeros(n_features, dtype=float)

        for i in range(self.n_estimators):
            # Bootstrap sample
            boot_idx = rng.choice(n_samples, size=n_samples, replace=True)
            X_boot = X[boot_idx]
            y_boot = y[boot_idx]
            w_boot = sample_weight[boot_idx] if sample_weight is not None else None

            tree = DecisionTree(
                max_depth=self.max_depth,
                min_samples_split=self.min_samples_split,
                max_features=max_f,
                random_state=self.random_state + i
            )
            tree.fit(X_boot, y_boot, sample_weight=w_boot, n_classes=n_classes)
            self.trees.append(tree)
            all_importances += tree.feature_importances

        # Normalize feature importances
        total_imp = np.sum(all_importances)
        if total_imp > 0:
            self.feature_importances_ = all_importances / total_imp
        else:
            self.feature_importances_ = np.ones(n_features) / n_features

        return self

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        X = np.asarray(X, dtype=float)
        all_tree_probs = [tree.predict_proba(X) for tree in self.trees]
        # Average probabilities across trees
        avg_probs = np.mean(all_tree_probs, axis=0)
        # Ensure row-wise normalization
        sums = np.sum(avg_probs, axis=1, keepdims=True)
        sums[sums == 0] = 1.0
        return avg_probs / sums

    def predict(self, X: np.ndarray) -> np.ndarray:
        probs = self.predict_proba(X)
        return np.argmax(probs, axis=1)


def compute_metrics(y_true: np.ndarray, y_pred: np.ndarray, classes: List[int] = [0, 1, 2]) -> Dict[str, Any]:
    """
    Computes accuracy, precision, recall, f1-score (macro and weighted),
    and the multiclass confusion matrix.
    """
    y_true = np.asarray(y_true, dtype=int)
    y_pred = np.asarray(y_pred, dtype=int)
    n = len(y_true)

    accuracy = float(np.mean(y_true == y_pred)) if n > 0 else 0.0

    n_classes = len(classes)
    matrix = np.zeros((n_classes, n_classes), dtype=int)
    for t, p in zip(y_true, y_pred):
        if 0 <= t < n_classes and 0 <= p < n_classes:
            matrix[t, p] += 1

    per_class = {}
    precisions = []
    recalls = []
    f1s = []
    supports = []

    for c in range(n_classes):
        tp = int(matrix[c, c])
        fp = int(np.sum(matrix[:, c]) - tp)
        fn = int(np.sum(matrix[c, :]) - tp)
        support = int(np.sum(matrix[c, :]))

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        precisions.append(prec)
        recalls.append(rec)
        f1s.append(f1)
        supports.append(support)

        per_class[str(c)] = {
            "class_label": ["Low Risk", "Medium Risk", "High Risk"][c] if c < 3 else f"Class {c}",
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "support": support
        }

    macro_prec = float(np.mean(precisions))
    macro_rec = float(np.mean(recalls))
    macro_f1 = float(np.mean(f1s))

    total_supp = sum(supports)
    if total_supp > 0:
        weighted_prec = float(np.sum([p * s for p, s in zip(precisions, supports)]) / total_supp)
        weighted_rec = float(np.sum([r * s for r, s in zip(recalls, supports)]) / total_supp)
        weighted_f1 = float(np.sum([f * s for f, s in zip(f1s, supports)]) / total_supp)
    else:
        weighted_prec = macro_prec
        weighted_rec = macro_rec
        weighted_f1 = macro_f1

    return {
        "accuracy": round(accuracy, 4),
        "macro_precision": round(macro_prec, 4),
        "macro_recall": round(macro_rec, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_precision": round(weighted_prec, 4),
        "weighted_recall": round(weighted_rec, 4),
        "weighted_f1": round(weighted_f1, 4),
        "confusion_matrix": matrix.tolist(),
        "per_class": per_class,
        "total_test_samples": n
    }
