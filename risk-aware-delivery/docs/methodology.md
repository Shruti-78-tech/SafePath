# Algorithmic Methodology & Mathematical Foundations

**Project:** Risk-Aware Essential Supply Delivery Route Planning System  
**Problem Statement ID:** SIH26002 (Smart India Hackathon 2026)

---

## 1. Risk-Aware A* Edge Cost Formulation

Traditional shortest-path algorithms (such as standard Dijkstra) optimize purely for distance:
$$ \text{Cost}_{\text{baseline}}(e) = \text{distance}(e) $$
In emergency logistics during floods, landslides, and gale-force storms, the shortest geographical corridor often traverses catastrophic hazards (e.g., lowland river causeways or unstable mountain slopes).

### The Risk-Penalized Cost Equation
For each directed road edge $e = (u, v)$, the effective traversing cost is modeled as:
$$ c(e) = t_{\text{base}}(e) \times \left(1.0 + w_{\text{profile}} \times R(e) \times \gamma(e)\right) $$

Where:
- $t_{\text{base}}(e) = \frac{\text{length}(e)}{v_{\text{limit}}(e)}$ is the free-flow travel time in seconds.
- $w_{\text{profile}}$ is the operator routing preference weight:
  - **Fastest Profile**: $w = 0.0$ (Strictly minimizes baseline travel time, ignoring hazards).
  - **Balanced Profile**: $w = 1.8$ (Balances reasonable detours against hazardous exposure).
  - **Safest Profile**: $w = 4.5$ (Aggressively avoids high-risk corridors).
- $R(e)$ is the aggregate disruption risk score computed from the Random Forest class probabilities:
  $$ R(e) = 0.1 \cdot P(\text{Low}) + 0.5 \cdot P(\text{Medium}) + 1.0 \cdot P(\text{High}) $$
- $\gamma(e)$ is the safety penalty multiplier applied in the *Safest* profile:
  $$ \gamma(e) = \begin{cases} 3.0 & \text{if } e \text{ is High Risk} \\ 1.5 & \text{if } e \text{ is Medium Risk} \\ 1.0 & \text{otherwise} \end{cases} $$

---

## 2. Proof of Heuristic Admissibility

For the A* algorithm to guarantee finding an optimal path, the heuristic function $h(n)$ must be **admissible** (it must never overestimate the true remaining cost from node $n$ to the goal $G$):
$$ h(n) \le c^*(n, G) \quad \forall n $$

### Heuristic Definition
We define $h(n)$ as the Great-Circle Haversine distance between node $n$ and goal $G$, divided by the maximum permissible velocity across the entire road network ($v_{\max} = 80 \text{ km/h} \approx 22.22 \text{ m/s}$):
$$ h(n) = \frac{\text{haversine\_distance}(n, G)}{v_{\max}} $$

### Admissibility & Consistency Proof
1. **Distance Lower Bound**: In Euclidean / spherical geometry, the straight-line (great circle) distance is the absolute shortest possible physical path between two points:
   $$ \text{distance}(n, G) \ge \text{haversine\_distance}(n, G) $$
2. **Velocity Upper Bound**: The velocity on any road segment $e$ is bounded by $v(e) \le v_{\max}$. Therefore:
   $$ t_{\text{base}}(e) = \frac{\text{length}(e)}{v(e)} \ge \frac{\text{length}(e)}{v_{\max}} $$
3. **Non-Negative Risk Penalty**: Because probabilities $P \ge 0$, risk factor $R(e) \ge 0$, and weights $w \ge 0$, the risk penalty term is strictly non-negative:
   $$ c(e) \ge t_{\text{base}}(e) \ge \frac{\text{length}(e)}{v_{\max}} $$
4. **Summation Over Path**: For any path $P = (n = v_0, v_1, \dots, v_k = G)$:
   $$ \sum_{i=0}^{k-1} c(v_i, v_{i+1}) \ge \frac{\sum_{i=0}^{k-1} \text{length}(v_i, v_{i+1})}{v_{\max}} \ge \frac{\text{haversine\_distance}(n, G)}{v_{\max}} = h(n) $$

Hence, $h(n) \le c^*(n, G)$ holds strictly for all nodes, proving that $h(n)$ is **strictly admissible and monotone (consistent)**. The A* algorithm will always discover the mathematically optimal risk-aware path without premature pruning.

---

## 3. Supervised Machine Learning Pipeline

### Random Forest Classifier
- **Ensemble Size**: 35 decision trees.
- **Criterion**: Gini Impurity reduction:
  $$ I_G(p) = 1 - \sum_{i=0}^{2} p_i^2 $$
- **Subsampling**: Random feature selection with $m = \lfloor\sqrt{d}\rfloor = 3$ features per split candidate.
- **Class Imbalance Mitigation**: Balanced sample weighting applied dynamically:
  $$ w_c = \frac{N}{3 \cdot N_c} $$

---

## 4. Rule-Based Reasoning Engine Policies

The rule engine acts as an explainable safety supervisor over the ML model and graph search:

| Rule Identifier | Policy Title | Trigger Condition | System Action |
| :--- | :--- | :--- | :--- |
| `RULE_01` | Official Road Closure | Edge reported officially closed by district authorities | Physically excised from available NetworkX graph |
| `RULE_02` | Weather Uncertainty | Open-Meteo live API times out or unreachable | Triggers simulation fallback; marks risk as uncertain |
| `RULE_03` | Severe Storm Hazard | Precipitation $\ge 50$ mm/h or Wind $\ge 60$ km/h | Emits high hazard warning for lowland river crossings |
| `RULE_04` | Infeasible Network | Target node disconnected from origin | Explains network severance and suggests staging depots |
| `RULE_05` | Safety-First Policy | User selects "Safest" profile | Applies non-linear high-hazard penalty |
| `RULE_06` | Unavoidable Risk | Recommended route traverses high-risk segment | Instructs dispatch of specialized high-clearance escorts |
| `RULE_07` | Efficiency Trade-Off | Safer route requires additional distance | Quantifies % risk reduction vs extra km required |
