# 🛠️ Missing Logic Fix Plan: License & Warehouse Supply Chain

After a thorough review of the original requirements and the implemented code, you are absolutely right. Two critical requirements from the original prompt were omitted during execution:

1. **License Fees**: Fast mode should charge a one-time license fee for Commercial, Industrial, and Public buildings. The `buy_license` RPC and UI integration are missing.
2. **Industrial → Commercial Supply Chain**: Big Commercial businesses require a full warehouse to operate. Industrial providers must fill these warehouses and earn cash/power. The `fill_warehouse` RPC and the UI for this interaction are missing.

Here is the proposed implementation plan to complete these missing requirements.

## Proposed Changes

### 1. Database Migrations (SQL)
#### [MODIFY] [build_modes_v1_migration.sql](file:///c:/Users/Hamidrexa/HackerSpace/Buildstack/buildiran/build_modes_v1_migration.sql)
We will add two missing RPCs to the end of the file:
1. `buy_license(p_asset_id UUID, p_fee BIGINT)`: Deducts cash from the player and sets `license_purchased = true`.
2. `fill_warehouse(p_industrial_asset_id UUID, p_commercial_asset_id UUID)`: 
   - Verifies the industrial provider has the required `farm_supply`, `factory_supply`, or `industrial_supply`.
   - Deducts activity from the provider.
   - Sets `warehouse_filled = true` on the commercial asset.
   - Awards power to the industrial provider based on the `providerGainPower` in constants.

### 2. State Management (Zustand)
#### [MODIFY] [useAssetStore.ts](file:///c:/Users/Hamidrexa/HackerSpace/Buildstack/buildiran/src/store/useAssetStore.ts)
- Add `buyLicense(assetId, fee)` action to handle optimistic UI updates (deduct cash, set `licensePurchased = true`).
- Add `fillWarehouse(industrialId, commercialId)` action to update local state (set `warehouseFilled = true` on the commercial asset) and call the RPC.

### 3. User Interface (UI)
#### [MODIFY] [BuildModal.tsx](file:///c:/Users/Hamidrexa/HackerSpace/Buildstack/buildiran/src/components/game/BuildModal.tsx)
- During Fast Mode confirmation, check if `LICENSE_FEE` > 0 for the selected category.
- If true, display a warning that the build includes a one-time license fee and deduct the combined (land + build + license) cost. The asset will be inserted with `license_purchased = true`.

#### [MODIFY] [AssetDetailModal.tsx](file:///c:/Users/Hamidrexa/HackerSpace/Buildstack/buildiran/src/components/game/AssetDetailModal.tsx)
- **For Commercial Owners**: If `requiresWarehouse` is true and `warehouseFilled` is false, show a red warning: "انبار خالی است. نیازمند تأمین توسط بخش صنعتی." (Warehouse empty. Needs supply from industrial sector).
- **For Industrial Owners**: When they open a Commercial asset, add a button "تأمین انبار" (Fill Warehouse) that triggers `fillWarehouse`, consuming their activity and granting them power.

## Verification Plan
### Manual Verification
1. Build a `shop` (Fast Mode) → Verify the client's cash is reduced by Cost + License Fee, and `license_purchased` is true.
2. Build a `mall` (requires warehouse). Attempt to use it → Should fail with "warehouse empty".
3. Tap on the `mall` as the owner of a `factory`. Click "Fill Warehouse" → Verify activity is deducted, power is granted, and the `mall` can now be used.

## User Review Required
> [!IMPORTANT]
> Does the proposed flow for filling the warehouse (Industrial owner tapping a Commercial building and pressing "Fill Warehouse") align with your vision, or should it be an automated background process? Please click **Proceed** if you approve the manual interaction plan.
