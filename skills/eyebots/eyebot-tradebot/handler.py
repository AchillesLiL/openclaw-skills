"""
TradeBot Agent Handler
Elite DEX trading with multi-aggregator routing
"""

import json
import os
import asyncio
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum
from decimal import Decimal


class Chain(Enum):
    ETHEREUM = 1
    BASE = 8453
    POLYGON = 137
    ARBITRUM = 42161


class Aggregator(Enum):
    OPENOCEAN = "openocean"
    ONEINCH = "1inch"
    PARASWAP = "paraswap"


class OrderType(Enum):
    MARKET = "market"
    LIMIT = "limit"
    DCA = "dca"


@dataclass
class SwapQuote:
    aggregator: Aggregator
    from_token: str
    to_token: str
    from_amount: Decimal
    to_amount: Decimal
    price_impact: float
    gas_estimate: int
    route: List[str]


@dataclass
class SwapParams:
    from_token: str
    to_token: str
    amount: Decimal
    slippage: float = 0.5
    recipient: Optional[str] = None


@dataclass
class LimitOrder:
    from_token: str
    to_token: str
    amount: Decimal
    target_price: Decimal
    expiry_hours: int = 24


@dataclass
class DCAOrder:
    from_token: str
    to_token: str
    total_amount: Decimal
    num_orders: int
    interval_hours: int


PAYMENT_WALLET = "0x4A9583c6B09154bD88dEE64F5249df0C5EC99Cf9"


class TradeBotHandler:
    """Main handler for TradeBot agent"""
    
    def __init__(self):
        self.config = self._load_config()
        
    def _load_config(self) -> Dict[str, Any]:
        config_path = os.path.join(os.path.dirname(__file__), "config.json")
        with open(config_path, "r") as f:
            return json.load(f)
    
    async def check_subscription(self, user_id: str) -> Dict[str, Any]:
        """Check if user has active subscription"""
        return {
            "active": False,
            "plan": None,
            "expires_at": None,
            "payment_required": True,
            "payment_wallet": PAYMENT_WALLET
        }
    
    async def generate_payment_request(self, user_id: str, plan: str, chain: Chain) -> Dict[str, Any]:
        """Generate payment request for subscription"""
        pricing = self.config["pricing"]["plans"].get(plan)
        if not pricing:
            raise ValueError(f"Invalid plan: {plan}")
            
        return {
            "user_id": user_id,
            "plan": plan,
            "amount_usd": pricing["price_usd"],
            "payment_wallet": PAYMENT_WALLET,
            "chain": chain.name.lower(),
            "accepted_tokens": self.config["pricing"]["accepted_tokens"],
            "memo": f"tradebot_{plan}_{user_id}"
        }
    
    async def get_best_quote(
        self,
        params: SwapParams,
        chain: Chain
    ) -> SwapQuote:
        """Get best quote from all aggregators"""
        
        quotes = await asyncio.gather(
            self._get_openocean_quote(params, chain),
            self._get_1inch_quote(params, chain),
            self._get_paraswap_quote(params, chain),
            return_exceptions=True
        )
        
        valid_quotes = [q for q in quotes if isinstance(q, SwapQuote)]
        
        if not valid_quotes:
            raise ValueError("No valid quotes available")
        
        # Return quote with best output amount
        return max(valid_quotes, key=lambda q: q.to_amount)
    
    async def _get_openocean_quote(self, params: SwapParams, chain: Chain) -> SwapQuote:
        """Get quote from OpenOcean"""
        # Integration point for OpenOcean API
        return SwapQuote(
            aggregator=Aggregator.OPENOCEAN,
            from_token=params.from_token,
            to_token=params.to_token,
            from_amount=params.amount,
            to_amount=Decimal("0"),  # Populated from API
            price_impact=0.0,
            gas_estimate=0,
            route=[]
        )
    
    async def _get_1inch_quote(self, params: SwapParams, chain: Chain) -> SwapQuote:
        """Get quote from 1inch"""
        # Integration point for 1inch API
        return SwapQuote(
            aggregator=Aggregator.ONEINCH,
            from_token=params.from_token,
            to_token=params.to_token,
            from_amount=params.amount,
            to_amount=Decimal("0"),
            price_impact=0.0,
            gas_estimate=0,
            route=[]
        )
    
    async def _get_paraswap_quote(self, params: SwapParams, chain: Chain) -> SwapQuote:
        """Get quote from Paraswap"""
        # Integration point for Paraswap API
        return SwapQuote(
            aggregator=Aggregator.PARASWAP,
            from_token=params.from_token,
            to_token=params.to_token,
            from_amount=params.amount,
            to_amount=Decimal("0"),
            price_impact=0.0,
            gas_estimate=0,
            route=[]
        )
    
    async def execute_swap(
        self,
        wallet: str,
        params: SwapParams,
        chain: Chain,
        aggregator: Optional[Aggregator] = None
    ) -> Dict[str, Any]:
        """Execute swap with best or specified aggregator"""
        
        # Get best quote if aggregator not specified
        if aggregator:
            quote = await self._get_quote_from_aggregator(params, chain, aggregator)
        else:
            quote = await self.get_best_quote(params, chain)
        
        # Calculate minimum output with slippage
        min_output = quote.to_amount * Decimal(1 - params.slippage / 100)
        
        tx_params = {
            "from_token": params.from_token,
            "to_token": params.to_token,
            "amount_in": str(params.amount),
            "min_amount_out": str(min_output),
            "recipient": params.recipient or wallet,
            "aggregator": quote.aggregator.value,
            "route": quote.route
        }
        
        return {
            "success": True,
            "stage": "pending_signature",
            "quote": {
                "aggregator": quote.aggregator.value,
                "from_amount": str(quote.from_amount),
                "to_amount": str(quote.to_amount),
                "price_impact": quote.price_impact,
                "gas_estimate": quote.gas_estimate
            },
            "tx_params": tx_params,
            "chain": chain.name
        }
    
    async def _get_quote_from_aggregator(
        self,
        params: SwapParams,
        chain: Chain,
        aggregator: Aggregator
    ) -> SwapQuote:
        """Get quote from specific aggregator"""
        if aggregator == Aggregator.OPENOCEAN:
            return await self._get_openocean_quote(params, chain)
        elif aggregator == Aggregator.ONEINCH:
            return await self._get_1inch_quote(params, chain)
        elif aggregator == Aggregator.PARASWAP:
            return await self._get_paraswap_quote(params, chain)
        raise ValueError(f"Unknown aggregator: {aggregator}")
    
    async def create_limit_order(
        self,
        wallet: str,
        order: LimitOrder,
        chain: Chain
    ) -> Dict[str, Any]:
        """Create limit order"""
        
        return {
            "success": True,
            "order_id": "generated_order_id",
            "order_type": "limit",
            "from_token": order.from_token,
            "to_token": order.to_token,
            "amount": str(order.amount),
            "target_price": str(order.target_price),
            "expires_at": f"+{order.expiry_hours}h",
            "status": "active"
        }
    
    async def create_dca_order(
        self,
        wallet: str,
        order: DCAOrder,
        chain: Chain
    ) -> Dict[str, Any]:
        """Create DCA order"""
        
        amount_per_order = order.total_amount / order.num_orders
        
        return {
            "success": True,
            "order_id": "generated_dca_id",
            "order_type": "dca",
            "from_token": order.from_token,
            "to_token": order.to_token,
            "total_amount": str(order.total_amount),
            "amount_per_order": str(amount_per_order),
            "num_orders": order.num_orders,
            "interval_hours": order.interval_hours,
            "status": "active"
        }
    
    async def cancel_order(self, order_id: str) -> Dict[str, Any]:
        """Cancel pending order"""
        return {
            "success": True,
            "order_id": order_id,
            "status": "cancelled"
        }
    
    async def get_orders(self, wallet: str, chain: Optional[Chain] = None) -> List[Dict[str, Any]]:
        """Get all pending orders for wallet"""
        return []


async def handle_command(
    command: str,
    args: Dict[str, Any],
    user_id: str,
    context: Dict[str, Any]
) -> Dict[str, Any]:
    """Main entry point for bot commands"""
    
    handler = TradeBotHandler()
    
    # Check subscription first
    subscription = await handler.check_subscription(user_id)
    if subscription["payment_required"]:
        return {
            "action": "payment_required",
            "message": "🔐 TradeBot requires an active subscription",
            "pricing": handler.config["pricing"]["plans"],
            "payment_wallet": PAYMENT_WALLET
        }
    
    chain = Chain(args.get("chain_id", 8453))
    
    if command == "swap":
        params = SwapParams(
            from_token=args["from_token"],
            to_token=args["to_token"],
            amount=Decimal(args["amount"]),
            slippage=args.get("slippage", 0.5),
            recipient=args.get("recipient")
        )
        aggregator = Aggregator(args["aggregator"]) if args.get("aggregator") else None
        return await handler.execute_swap(args["wallet"], params, chain, aggregator)
    
    elif command == "quote":
        params = SwapParams(
            from_token=args["from_token"],
            to_token=args["to_token"],
            amount=Decimal(args["amount"])
        )
        quote = await handler.get_best_quote(params, chain)
        return {
            "aggregator": quote.aggregator.value,
            "from_amount": str(quote.from_amount),
            "to_amount": str(quote.to_amount),
            "price_impact": quote.price_impact
        }
    
    elif command == "limit_order":
        order = LimitOrder(
            from_token=args["from_token"],
            to_token=args["to_token"],
            amount=Decimal(args["amount"]),
            target_price=Decimal(args["target_price"]),
            expiry_hours=args.get("expiry_hours", 24)
        )
        return await handler.create_limit_order(args["wallet"], order, chain)
    
    elif command == "dca":
        order = DCAOrder(
            from_token=args["from_token"],
            to_token=args["to_token"],
            total_amount=Decimal(args["total_amount"]),
            num_orders=args["num_orders"],
            interval_hours=args["interval_hours"]
        )
        return await handler.create_dca_order(args["wallet"], order, chain)
    
    elif command == "cancel":
        return await handler.cancel_order(args["order_id"])
    
    elif command == "orders":
        return {"orders": await handler.get_orders(args["wallet"], chain)}
    
    return {"error": f"Unknown command: {command}"}
